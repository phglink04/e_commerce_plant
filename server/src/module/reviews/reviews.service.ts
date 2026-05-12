import {
  Injectable,
  BadRequestException,
  NotFoundException,
  ForbiddenException,
  ConflictException,
} from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { Review } from "./schemas/review.schema";
import { Order } from "../orders/schemas/order.schema";
import { Plant } from "../plants/schemas/plant.schema";
import { CreateReviewDto } from "./dto/create-review.dto";
import { AddReplyDto } from "./dto/add-reply.dto";

@Injectable()
export class ReviewsService {
  constructor(
    @InjectModel(Review.name) private readonly reviewModel: Model<Review>,
    @InjectModel(Order.name) private readonly orderModel: Model<Order>,
    @InjectModel(Plant.name) private readonly plantModel: Model<Plant>,
  ) {}

  /**
   * Create a new review (user must have purchased the product)
   */
  async create(
    userId: string,
    userName: string,
    userAvatar: string,
    userRole: string,
    dto: CreateReviewDto,
  ) {
    // Validate: content or images must be provided
    if (
      (!dto.content || dto.content.trim().length === 0) &&
      (!dto.images || dto.images.length === 0)
    ) {
      throw new BadRequestException(
        "Review must have either text content or at least one image",
      );
    }

    // Verify that the order exists, belongs to the user, and contains the product
    const order = await this.orderModel
      .findOne({
        _id: dto.orderId,
        userId,
        orderStatus: "delivered",
      })
      .lean();

    if (!order) {
      throw new ForbiddenException(
        "You can only review products from your delivered orders",
      );
    }

    const hasProduct = order.items.some(
      (item) => item.plantId === dto.productId,
    );
    if (!hasProduct) {
      throw new BadRequestException(
        "This product is not in the specified order",
      );
    }

    // Check for existing review (one review per user per product)
    const existing = await this.reviewModel
      .findOne({ userId, productId: dto.productId })
      .lean();
    if (existing) {
      throw new ConflictException("You have already reviewed this product");
    }

    // Verify product exists
    const product = await this.plantModel.findById(dto.productId).lean();
    if (!product) {
      throw new NotFoundException("Product not found");
    }

    const review = await this.reviewModel.create({
      userId,
      userName,
      userAvatar: userAvatar || "",
      productId: dto.productId,
      orderId: dto.orderId,
      rating: dto.rating,
      content: dto.content?.trim() || "",
      images: dto.images || [],
      isVerifiedPurchase: true,
      isApproved: true, // Auto-approved: user has a delivered order
      likes: 0,
      likedBy: [],
      replies: [],
    });

    // Update product rating
    await this.recalculateProductRating(dto.productId);

    return {
      message: "Đánh giá đã được đăng thành công",
      data: { review: this.toReviewResponse(review.toObject()) },
    };
  }

  /**
   * Get reviews for a product (public - only approved reviews)
   */
  async getByProduct(query: {
    productId: string;
    page?: number;
    limit?: number;
    rating?: number;
    withImages?: boolean;
    verifiedOnly?: boolean;
    sort?: string;
  }) {
    const page = Math.max(1, Number(query.page ?? 1));
    const limit = Math.min(50, Math.max(1, Number(query.limit ?? 10)));

    const filter: Record<string, unknown> = {
      productId: query.productId,
      isApproved: true,
    };

    if (query.rating && query.rating >= 1 && query.rating <= 5) {
      filter.rating = query.rating;
    }

    if (query.withImages) {
      filter.images = { $exists: true, $not: { $size: 0 } };
    }

    if (query.verifiedOnly) {
      filter.isVerifiedPurchase = true;
    }

    const sortOption: Record<string, 1 | -1> = {};
    switch (query.sort) {
      case "newest":
        sortOption.createdAt = -1;
        break;
      case "oldest":
        sortOption.createdAt = 1;
        break;
      case "highest":
        sortOption.rating = -1;
        sortOption.createdAt = -1;
        break;
      case "lowest":
        sortOption.rating = 1;
        sortOption.createdAt = -1;
        break;
      case "most_liked":
        sortOption.likes = -1;
        sortOption.createdAt = -1;
        break;
      default:
        sortOption.createdAt = -1;
    }

    const totalResults = await this.reviewModel.countDocuments(filter);
    const reviews = await this.reviewModel
      .find(filter)
      .sort(sortOption)
      .skip((page - 1) * limit)
      .limit(limit)
      .lean();

    return {
      results: reviews.length,
      totalResults,
      page,
      totalPages: Math.max(1, Math.ceil(totalResults / limit)),
      data: {
        reviews: reviews.map((r) => this.toReviewResponse(r)),
      },
    };
  }

  /**
   * Get rating summary for a product
   */
  async getRatingSummary(productId: string) {
    const pipeline = [
      { $match: { productId, isApproved: true } },
      {
        $group: {
          _id: null,
          averageRating: { $avg: "$rating" },
          totalReviews: { $sum: 1 },
          rating1: { $sum: { $cond: [{ $eq: ["$rating", 1] }, 1, 0] } },
          rating2: { $sum: { $cond: [{ $eq: ["$rating", 2] }, 1, 0] } },
          rating3: { $sum: { $cond: [{ $eq: ["$rating", 3] }, 1, 0] } },
          rating4: { $sum: { $cond: [{ $eq: ["$rating", 4] }, 1, 0] } },
          rating5: { $sum: { $cond: [{ $eq: ["$rating", 5] }, 1, 0] } },
          withImages: {
            $sum: {
              $cond: [{ $gt: [{ $size: "$images" }, 0] }, 1, 0],
            },
          },
        },
      },
    ];

    const result = await this.reviewModel.aggregate(pipeline);

    if (!result || result.length === 0) {
      return {
        data: {
          averageRating: 0,
          totalReviews: 0,
          ratingDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
          withImages: 0,
        },
      };
    }

    const summary = result[0];
    return {
      data: {
        averageRating: Math.round(summary.averageRating * 10) / 10,
        totalReviews: summary.totalReviews,
        ratingDistribution: {
          1: summary.rating1,
          2: summary.rating2,
          3: summary.rating3,
          4: summary.rating4,
          5: summary.rating5,
        },
        withImages: summary.withImages,
      },
    };
  }

  /**
   * Like / unlike a review
   */
  async toggleLike(reviewId: string, userId: string) {
    const review = await this.reviewModel.findById(reviewId);
    if (!review) {
      throw new NotFoundException("Review not found");
    }

    const alreadyLiked = review.likedBy.includes(userId);

    if (alreadyLiked) {
      review.likedBy = review.likedBy.filter((id) => id !== userId);
      review.likes = Math.max(0, review.likes - 1);
    } else {
      review.likedBy.push(userId);
      review.likes += 1;
    }

    await review.save();

    return {
      message: alreadyLiked ? "Like removed" : "Review liked",
      data: {
        likes: review.likes,
        isLiked: !alreadyLiked,
      },
    };
  }

  /**
   * Add a reply to a review
   */
  async addReply(
    reviewId: string,
    userId: string,
    userName: string,
    userAvatar: string,
    userRole: string,
    dto: AddReplyDto,
  ) {
    const review = await this.reviewModel.findById(reviewId);
    if (!review) {
      throw new NotFoundException("Review not found");
    }

    // Limit replies per review to prevent abuse
    if (review.replies.length >= 50) {
      throw new BadRequestException("Maximum number of replies reached");
    }

    const isAdmin = userRole === "admin" || userRole === "owner";

    review.replies.push({
      userId,
      userName,
      userAvatar: userAvatar || "",
      content: dto.content.trim(),
      isAdmin,
    } as any);

    await review.save();

    return {
      message: "Reply added",
      data: { review: this.toReviewResponse(review.toObject()) },
    };
  }

  /**
   * Check if current user can review a specific product
   */
  async canReview(userId: string, productId: string) {
    // Check if already reviewed
    const existing = await this.reviewModel
      .findOne({ userId, productId })
      .lean();
    if (existing) {
      return {
        data: { canReview: false, reason: "Already reviewed" },
      };
    }

    // Check if user has a delivered order with this product
    const order = await this.orderModel
      .findOne({
        userId,
        orderStatus: "delivered",
        "items.plantId": productId,
      })
      .lean();

    if (!order) {
      return {
        data: {
          canReview: false,
          reason: "No delivered order with this product",
        },
      };
    }

    return {
      data: {
        canReview: true,
        orderId: String(order._id),
      },
    };
  }

  // ─── User Profile Methods ──────────────────────────────────

  /**
   * Get all reviews by a specific user (for profile page)
   */
  async getMyReviews(userId: string, query?: { page?: number; limit?: number }) {
    const page = Math.max(1, Number(query?.page ?? 1));
    const limit = Math.min(50, Math.max(1, Number(query?.limit ?? 10)));

    const filter = { userId };
    const totalResults = await this.reviewModel.countDocuments(filter);
    const reviews = await this.reviewModel
      .find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean();

    return {
      results: reviews.length,
      totalResults,
      page,
      totalPages: Math.max(1, Math.ceil(totalResults / limit)),
      data: { reviews: reviews.map((r) => this.toReviewResponse(r)) },
    };
  }

  /**
   * Update own review (user can only edit content, rating, images)
   */
  async updateMyReview(
    userId: string,
    reviewId: string,
    payload: { rating?: number; content?: string; images?: string[] },
  ) {
    const review = await this.reviewModel.findById(reviewId);
    if (!review) {
      throw new NotFoundException("Review not found");
    }

    if (review.userId !== userId) {
      throw new ForbiddenException("You can only edit your own reviews");
    }

    if (payload.rating !== undefined) review.rating = payload.rating;
    if (payload.content !== undefined) review.content = payload.content.trim();
    if (payload.images !== undefined) review.images = payload.images;

    // Keep approved since user already verified
    review.isApproved = true;
    await review.save();

    await this.recalculateProductRating(review.productId);

    return {
      message: "Đánh giá đã được cập nhật",
      data: { review: this.toReviewResponse(review.toObject()) },
    };
  }

  /**
   * Delete own review
   */
  async deleteMyReview(userId: string, reviewId: string) {
    const review = await this.reviewModel.findById(reviewId);
    if (!review) {
      throw new NotFoundException("Review not found");
    }

    if (review.userId !== userId) {
      throw new ForbiddenException("You can only delete your own reviews");
    }

    const productId = review.productId;
    await this.reviewModel.findByIdAndDelete(reviewId);
    await this.recalculateProductRating(productId);

    return { message: "Review deleted" };
  }

  // ─── Admin Methods ────────────────────────────────────────

  /**
   * Get all reviews (admin) with filters
   */
  async adminGetAll(query?: {
    page?: number;
    limit?: number;
    productId?: string;
    rating?: number;
    status?: string;
    search?: string;
  }) {
    const page = Math.max(1, Number(query?.page ?? 1));
    const limit = Math.min(50, Math.max(1, Number(query?.limit ?? 10)));

    const filter: Record<string, unknown> = {};

    if (query?.productId) {
      filter.productId = query.productId;
    }

    if (query?.rating && Number(query.rating) >= 1 && Number(query.rating) <= 5) {
      filter.rating = Number(query.rating);
    }

    if (query?.status === "approved") {
      filter.isApproved = true;
    } else if (query?.status === "pending") {
      filter.isApproved = false;
    }

    if (query?.search) {
      const escaped = query.search
        .trim()
        .replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      filter.$or = [
        { content: { $regex: new RegExp(escaped, "i") } },
        { userName: { $regex: new RegExp(escaped, "i") } },
      ];
    }

    const totalResults = await this.reviewModel.countDocuments(filter);
    const reviews = await this.reviewModel
      .find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean();

    return {
      results: reviews.length,
      totalResults,
      page,
      totalPages: Math.max(1, Math.ceil(totalResults / limit)),
      data: { reviews: reviews.map((r) => this.toReviewResponse(r)) },
    };
  }

  /**
   * Approve a review
   */
  async approve(reviewId: string) {
    const review = await this.reviewModel
      .findByIdAndUpdate(reviewId, { isApproved: true }, { new: true })
      .lean();

    if (!review) {
      throw new NotFoundException("Review not found");
    }

    // Recalculate product rating
    await this.recalculateProductRating(review.productId);

    return {
      message: "Review approved",
      data: { review: this.toReviewResponse(review) },
    };
  }

  /**
   * Reject (un-approve) a review
   */
  async reject(reviewId: string) {
    const review = await this.reviewModel
      .findByIdAndUpdate(reviewId, { isApproved: false }, { new: true })
      .lean();

    if (!review) {
      throw new NotFoundException("Review not found");
    }

    await this.recalculateProductRating(review.productId);

    return {
      message: "Review rejected",
      data: { review: this.toReviewResponse(review) },
    };
  }

  /**
   * Delete a review (admin)
   */
  async remove(reviewId: string) {
    const review = await this.reviewModel.findByIdAndDelete(reviewId).lean();
    if (!review) {
      throw new NotFoundException("Review not found");
    }

    // Recalculate product rating
    await this.recalculateProductRating(review.productId);

    return { message: "Review deleted" };
  }

  // ─── Helpers ──────────────────────────────────────────────

  /**
   * Recalculate and update the product's average rating
   */
  private async recalculateProductRating(productId: string) {
    const result = await this.reviewModel.aggregate([
      { $match: { productId, isApproved: true } },
      {
        $group: {
          _id: null,
          averageRating: { $avg: "$rating" },
        },
      },
    ]);

    const avg = result.length > 0 ? Math.round(result[0].averageRating * 10) / 10 : 0;

    await this.plantModel.findByIdAndUpdate(productId, { rating: avg });
  }

  private toReviewResponse(review: any) {
    return {
      id: String(review._id),
      userId: review.userId,
      userName: review.userName,
      userAvatar: review.userAvatar || "",
      productId: review.productId,
      orderId: review.orderId,
      rating: review.rating,
      content: review.content,
      images: review.images || [],
      isVerifiedPurchase: review.isVerifiedPurchase,
      isApproved: review.isApproved,
      likes: review.likes || 0,
      likedBy: review.likedBy || [],
      replies: (review.replies || []).map((r: any) => ({
        userId: r.userId,
        userName: r.userName,
        userAvatar: r.userAvatar || "",
        content: r.content,
        isAdmin: r.isAdmin || false,
        createdAt: r.createdAt
          ? new Date(r.createdAt).toISOString()
          : new Date().toISOString(),
      })),
      createdAt: review.createdAt
        ? new Date(review.createdAt).toISOString()
        : new Date().toISOString(),
      updatedAt: review.updatedAt
        ? new Date(review.updatedAt).toISOString()
        : new Date().toISOString(),
    };
  }
}
