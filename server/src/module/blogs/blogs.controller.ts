import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Logger,
  NotFoundException,
  Param,
  Patch,
  Post,
  Query,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from "@nestjs/common";
import { BlogsService } from "./blogs.service";
import { UpsertBlogDto } from "./dto/upsert-blog.dto";
import { JwtAuthGuard } from "../../auth/guards/jwt-auth.guard";
import { RolesGuard } from "../../auth/guards/roles.guard";
import { Roles } from "../../auth/decorators/roles.decorator";
import { SupabaseStorageService } from "../../helpers/supabase-storage.service";
import { UploadInterceptor } from "../../helpers/upload.interceptor";

@Controller("blogs")
export class BlogsController {
  private readonly logger = new Logger(BlogsController.name);

  constructor(
    private readonly blogsService: BlogsService,
    private readonly supabaseStorageService: SupabaseStorageService,
  ) {}

  // Public endpoints

  @Get("published")
  getPublishedBlogs(@Query() query: Record<string, string | undefined>) {
    return this.blogsService.getPublished(query);
  }

  @Get("featured")
  getFeaturedBlogs() {
    return this.blogsService.getFeatured();
  }

  @Get("slug/:slug")
  async getBlogBySlug(@Param("slug") slug: string) {
    const blog = await this.blogsService.getBySlug(slug);
    if (!blog) {
      throw new NotFoundException("Blog not found");
    }
    return blog;
  }

  // Admin endpoints

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("admin", "owner")
  getAllBlogs(@Query() query: Record<string, string | undefined>) {
    return this.blogsService.getAll(query);
  }

  @Get(":id")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("admin", "owner")
  async getBlogById(@Param("id") id: string) {
    const blog = await this.blogsService.getById(id);
    if (!blog) {
      throw new NotFoundException("Blog not found");
    }
    return blog;
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("admin", "owner")
  @UseInterceptors(UploadInterceptor("image"))
  async createBlog(
    @Body() dto: UpsertBlogDto,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    if (file) {
      try {
        dto.coverImage = await this.supabaseStorageService.uploadFile(
          file,
          "blogs",
        );
      } catch (err) {
        this.logger.warn(
          `Image upload failed, falling back to coverImage URL if provided: ${err}`,
        );
        // If coverImage URL was also provided in the body, we continue with that
        // Otherwise the check below will throw
      }
    }

    if (!dto.coverImage) {
      throw new BadRequestException(
        "Image upload failed and no coverImage URL was provided. Please provide a cover image URL or try uploading again.",
      );
    }

    return this.blogsService.create(dto);
  }

  @Patch(":id")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("admin", "owner")
  @UseInterceptors(UploadInterceptor("image"))
  async updateBlog(
    @Param("id") id: string,
    @Body() dto: UpsertBlogDto,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    if (file) {
      try {
        dto.coverImage = await this.supabaseStorageService.uploadFile(
          file,
          "blogs",
        );
      } catch (err) {
        this.logger.warn(
          `Image upload failed during update, continuing without new image: ${err}`,
        );
        // For updates, the existing coverImage in the DB will be kept
      }
    }

    const updated = await this.blogsService.update(id, dto);
    if (!updated) {
      throw new NotFoundException("Blog not found");
    }
    return updated;
  }

  @Delete(":id")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("admin", "owner")
  async deleteBlog(@Param("id") id: string) {
    const removed = await this.blogsService.remove(id);
    if (!removed) {
      throw new BadRequestException("Blog not found");
    }
    return { message: "Blog deleted" };
  }
}
