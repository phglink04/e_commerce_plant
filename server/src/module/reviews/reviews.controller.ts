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
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from "@nestjs/common";
import { ReviewsService } from "./reviews.service";
import { CreateReviewDto } from "./dto/create-review.dto";
import { AddReplyDto } from "./dto/add-reply.dto";
import { JwtAuthGuard } from "../../auth/guards/jwt-auth.guard";
import { RolesGuard } from "../../auth/guards/roles.guard";
import { Roles } from "../../auth/decorators/roles.decorator";
import { CurrentUser } from "../../auth/decorators/current-user.decorator";
import { JwtPayload } from "../../auth/types/jwt-payload.type";
import { UploadInterceptor } from "../../helpers/upload.interceptor";
import { SupabaseStorageService } from "../../helpers/supabase-storage.service";

@Controller("reviews")
export class ReviewsController {
  constructor(
    private readonly reviewsService: ReviewsService,
    private readonly supabaseStorageService: SupabaseStorageService,
  ) {}

  /**
   * POST /reviews/upload-image → upload review image
   */
  @Post("upload-image")
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(UploadInterceptor("image"))
  async uploadReviewImage(
    @UploadedFile() file?: Express.Multer.File,
  ) {
    if (!file) {
      throw new BadRequestException("Image file is required");
    }
    const publicUrl = await this.supabaseStorageService.uploadFile(file, "reviews");
    return { publicUrl };
  }

  // ─── Public Endpoints ─────────────────────────────────────

  /**
   * GET /reviews?productId=xxx → list approved reviews for a product
   */
  @Get()
  getReviews(@Query() query: Record<string, string | undefined>) {
    const productId = query.productId;
    if (!productId) {
      throw new BadRequestException("productId is required");
    }

    return this.reviewsService.getByProduct({
      productId,
      page: query.page ? Number(query.page) : undefined,
      limit: query.limit ? Number(query.limit) : undefined,
      rating: query.rating ? Number(query.rating) : undefined,
      withImages: query.withImages === "true",
      verifiedOnly: query.verifiedOnly === "true",
      sort: query.sort,
    });
  }

  /**
   * GET /reviews/summary?productId=xxx → rating summary
   */
  @Get("summary")
  getRatingSummary(@Query("productId") productId: string) {
    if (!productId) {
      throw new BadRequestException("productId is required");
    }
    return this.reviewsService.getRatingSummary(productId);
  }

  /**
   * GET /reviews/can-review?productId=xxx → check if user can review
   */
  @Get("can-review")
  @UseGuards(JwtAuthGuard)
  canReview(
    @CurrentUser() user: JwtPayload,
    @Query("productId") productId: string,
  ) {
    if (!productId) {
      throw new BadRequestException("productId is required");
    }
    return this.reviewsService.canReview(user.sub, productId);
  }

  /**
   * GET /reviews/pending → get list of products user can review
   */
  @Get("pending")
  @UseGuards(JwtAuthGuard)
  getPendingReviews(@CurrentUser() user: JwtPayload) {
    return this.reviewsService.getPendingReviews(user.sub);
  }

  // ─── User Endpoints ──────────────────────────────────────

  /**
   * POST /reviews → create a review
   */
  @Post()
  @UseGuards(JwtAuthGuard)
  createReview(
    @CurrentUser() user: JwtPayload,
    @Body() dto: CreateReviewDto,
  ) {
    return this.reviewsService.create(
      user.sub,
      user.name,
      "", // avatar is not in jwt payload, could be fetched
      user.role,
      dto,
    );
  }

  /**
   * POST /reviews/:id/like → toggle like on a review
   */
  @Post(":id/like")
  @UseGuards(JwtAuthGuard)
  toggleLike(
    @CurrentUser() user: JwtPayload,
    @Param("id") id: string,
  ) {
    return this.reviewsService.toggleLike(id, user.sub);
  }

  /**
   * POST /reviews/:id/reply → add a reply
   */
  @Post(":id/reply")
  @UseGuards(JwtAuthGuard)
  addReply(
    @CurrentUser() user: JwtPayload,
    @Param("id") id: string,
    @Body() dto: AddReplyDto,
  ) {
    return this.reviewsService.addReply(
      id,
      user.sub,
      user.name,
      "",
      user.role,
      dto,
    );
  }

  /**
   * GET /reviews/my-reviews → list current user's reviews (for profile page)
   */
  @Get("my-reviews")
  @UseGuards(JwtAuthGuard)
  getMyReviews(
    @CurrentUser() user: JwtPayload,
    @Query() query: Record<string, string | undefined>,
  ) {
    return this.reviewsService.getMyReviews(user.sub, {
      page: query.page ? Number(query.page) : undefined,
      limit: query.limit ? Number(query.limit) : undefined,
    });
  }

  /**
   * PATCH /reviews/:id → update own review
   */
  @Patch(":id")
  @UseGuards(JwtAuthGuard)
  updateMyReview(
    @CurrentUser() user: JwtPayload,
    @Param("id") id: string,
    @Body() body: { rating?: number; content?: string; images?: string[] },
  ) {
    return this.reviewsService.updateMyReview(user.sub, id, body);
  }

  /**
   * DELETE /reviews/:id → delete own review
   */
  @Delete(":id")
  @UseGuards(JwtAuthGuard)
  deleteMyReview(
    @CurrentUser() user: JwtPayload,
    @Param("id") id: string,
  ) {
    return this.reviewsService.deleteMyReview(user.sub, id);
  }

  // ─── Admin Endpoints ─────────────────────────────────────

  /**
   * GET /reviews/admin → list all reviews for admin moderation
   */
  @Get("admin")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("admin", "owner")
  adminGetAll(@Query() query: Record<string, string | undefined>) {
    return this.reviewsService.adminGetAll({
      page: query.page ? Number(query.page) : undefined,
      limit: query.limit ? Number(query.limit) : undefined,
      productId: query.productId,
      rating: query.rating ? Number(query.rating) : undefined,
      status: query.status,
      search: query.search,
    });
  }

  /**
   * PATCH /reviews/admin/:id/approve → approve a review
   */
  @Patch("admin/:id/approve")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("admin", "owner")
  approveReview(@Param("id") id: string) {
    return this.reviewsService.approve(id);
  }

  /**
   * PATCH /reviews/admin/:id/reject → reject a review
   */
  @Patch("admin/:id/reject")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("admin", "owner")
  rejectReview(@Param("id") id: string) {
    return this.reviewsService.reject(id);
  }

  /**
   * DELETE /reviews/admin/:id → delete a review
   */
  @Delete("admin/:id")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("admin", "owner")
  deleteReview(@Param("id") id: string) {
    return this.reviewsService.remove(id);
  }
}
