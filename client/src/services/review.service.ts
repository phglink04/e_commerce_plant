/**
 * Review Service
 * API calls for public review interactions
 */

import { BaseApiService } from "./base-api.service";
import {
  Review,
  RatingSummary,
  CreateReviewPayload,
  CanReviewResponse,
  PaginatedResponse,
} from "@/types";
import { API_ENDPOINTS } from "@/constants";

class ReviewService extends BaseApiService {
  /**
   * Get reviews for a product with filters
   */
  async getReviews(params: {
    productId: string;
    page?: number;
    limit?: number;
    rating?: number;
    withImages?: boolean;
    verifiedOnly?: boolean;
    sort?: string;
  }): Promise<PaginatedResponse<Review>> {
    const response = await this.get<{ reviews: Review[] }>(
      API_ENDPOINTS.reviews.list,
      {
        params: {
          productId: params.productId,
          page: params.page,
          limit: params.limit,
          rating: params.rating || undefined,
          withImages: params.withImages || undefined,
          verifiedOnly: params.verifiedOnly || undefined,
          sort: params.sort || undefined,
        },
      },
    );

    return {
      items: response.data?.reviews || [],
      totalResults: response.totalResults || 0,
      totalPages: response.totalPages || 1,
      page: response.page || params.page || 1,
      limit: params.limit || 10,
    };
  }

  /**
   * Get rating summary for a product
   */
  async getRatingSummary(productId: string): Promise<RatingSummary> {
    const response = await this.get<RatingSummary>(
      API_ENDPOINTS.reviews.summary,
      {
        params: { productId },
      },
    );
    return response.data;
  }

  /**
   * Check if user can review a product
   */
  async canReview(productId: string): Promise<CanReviewResponse> {
    const response = await this.get<CanReviewResponse>(
      API_ENDPOINTS.reviews.canReview,
      {
        params: { productId },
      },
    );
    return response.data;
  }

  /**
   * Get list of products user can review
   */
  async getPendingReviews(): Promise<any[]> {
    const response = await this.get<{ pendingReviews: any[] }>(
      API_ENDPOINTS.reviews.pending
    );
    return response.data?.pendingReviews || [];
  }

  /**
   * Create a new review
   */
  async createReview(payload: CreateReviewPayload): Promise<Review> {
    const response = await this.post<{ review: Review }>(
      API_ENDPOINTS.reviews.create,
      payload,
    );
    return response.data.review;
  }

  /**
   * Toggle like on a review
   */
  async toggleLike(
    reviewId: string,
  ): Promise<{ likes: number; isLiked: boolean }> {
    const response = await this.post<{ likes: number; isLiked: boolean }>(
      API_ENDPOINTS.reviews.like(reviewId),
    );
    return response.data;
  }

  /**
   * Add a reply to a review
   */
  async addReply(reviewId: string, content: string): Promise<Review> {
    const response = await this.post<{ review: Review }>(
      API_ENDPOINTS.reviews.reply(reviewId),
      { content },
    );
    return response.data.review;
  }

  /**
   * Upload an image file for reviews
   */
  async uploadImage(file: File): Promise<{ publicUrl: string }> {
    const formData = new FormData();
    formData.append("image", file);
    const response = await this.uploadFile<any>(
      API_ENDPOINTS.reviews.uploadImage,
      formData,
    );
    if (response && (response as any).publicUrl) {
      return response as any;
    }
    return response.data;
  }
}

export const reviewService = new ReviewService();
