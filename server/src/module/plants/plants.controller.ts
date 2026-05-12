import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  NotFoundException,
  Param,
  Patch,
  Post,
  Query,
  Redirect,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from "@nestjs/common";
import { PlantsService } from "./plants.service";
import { UpsertPlantDto } from "./dto/upsert-plant.dto";
import { JwtAuthGuard } from "../../auth/guards/jwt-auth.guard";
import { RolesGuard } from "../../auth/guards/roles.guard";
import { Roles } from "../../auth/decorators/roles.decorator";
import { SupabaseStorageService } from "../../helpers/supabase-storage.service";
import { UploadInterceptor } from "../../helpers/upload.interceptor";
import {
  extractIdFromSlugAndId,
  extractSlugFromSlugAndId,
} from "../../helpers/slug.utils";

@Controller("plants")
export class PlantsController {
  constructor(
    private readonly plantsService: PlantsService,
    private readonly supabaseStorageService: SupabaseStorageService,
  ) {}

  @Get("featured-products")
  getFeaturedProducts() {
    return this.plantsService.getFeatured();
  }
  @Get("flash-sale")
  getFlashSaleProducts() {
    return this.plantsService.getFlashSale();
  }
  @Get("plant-stats")
  getPlantStats() {
    return this.plantsService.getStats();
  }

  @Get("plantTotal")
  async getTotalPlants() {
    const totalPlants = await this.plantsService.getTotalPlants();
    return { totalPlants };
  }

  @Get("availability/:availability")
  getPlantsByAvailability(@Param("availability") availability: string) {
    return this.plantsService.getByAvailability(availability);
  }

  @Get()
  getAllPlants(@Query() query: Record<string, string | undefined>) {
    return this.plantsService.getAll(query);
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("admin", "owner")
  @UseInterceptors(UploadInterceptor("image"))
  async createPlant(
    @Body() dto: UpsertPlantDto,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    if (file) {
      dto.imageCover = await this.supabaseStorageService.uploadFile(
        file,
        "plants",
      );
    }

    if (!dto.imageCover) {
      throw new BadRequestException("imageCover or image file is required");
    }

    return this.plantsService.create(dto);
  }

  @Get(":slugAndId")
  async getPlantBySlugAndId(@Param("slugAndId") slugAndId: string) {
    // Extract ID from slug+ID format (e.g., "aloe-vera-65f1a2b3c4d5e6f7")
    const id = extractIdFromSlugAndId(slugAndId);

    if (!id) {
      // Fallback: treat as plain ID for backward compatibility
      const plant = await this.plantsService.getById(slugAndId);
      if (!plant) {
        throw new NotFoundException("Plant not found");
      }
      return plant;
    }

    // Fetch plant by ID
    const plant = await this.plantsService.getById(id);
    if (!plant) {
      throw new NotFoundException("Plant not found");
    }

    // Validate slug matches - if not, client should redirect to correct URL
    const dbSlug = extractSlugFromSlugAndId(slugAndId);
    const correctSlug = (plant.data.plant as any).slug;

    if (dbSlug && correctSlug && dbSlug !== correctSlug) {
      // Return redirect information in response
      // Frontend will handle the redirect
      return {
        ...plant,
        _redirect: `/plant/${correctSlug}-${id}`,
      };
    }

    return plant;
  }

  @Patch(":id")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("admin", "owner")
  @UseInterceptors(UploadInterceptor("image"))
  async updatePlant(
    @Param("id") id: string,
    @Body() dto: UpsertPlantDto,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    if (file) {
      dto.imageCover = await this.supabaseStorageService.uploadFile(
        file,
        "plants",
      );
    }

    const updated = await this.plantsService.update(id, dto);
    if (!updated) {
      throw new NotFoundException("Plant not found");
    }
    return updated;
  }

  @Delete(":id")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("admin", "owner")
  async deletePlant(@Param("id") id: string) {
    const removed = await this.plantsService.remove(id);
    if (!removed) {
      throw new BadRequestException("Plant not found");
    }
    return { message: "Plant deleted" };
  }
}
