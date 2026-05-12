/**
 * Admin Review Service
 * API calls for admin review moderation
 */

import { BaseApiService } from "../base-api.service";
import { Review, PaginatedResponse } from "@/types";
import { API_ENDPOINTS } from "@/constants";

class AdminReviewService extends BaseApiService {
  /**
   * Get all reviews with admin filters
   */
  async getReviews(params: {
    page?: number;
    limit?: number;
    productId?: string;
    rating?: number;
    status?: string;
    search?: string;
  }): Promise<PaginatedResponse<Review>> {
    const response = await this.get<{ reviews: Review[] }>(
      API_ENDPOINTS.reviews.adminList,
      {
        params: {
          page: params.page,
          limit: params.limit,
          productId: params.productId || undefined,
          rating: params.rating || undefined,
          status: params.status || undefined,
          search: params.search?.trim() || undefined,
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
   * Approve a review
   */
  async approveReview(id: string): Promise<Review> {
    const response = await this.patch<{ review: Review }>(
      API_ENDPOINTS.reviews.adminApprove(id),
    );
    return response.data.review;
  }

  /**
   * Reject a review
   */
  async rejectReview(id: string): Promise<Review> {
    const response = await this.patch<{ review: Review }>(
      API_ENDPOINTS.reviews.adminReject(id),
    );
    return response.data.review;
  }

  /**
   * Delete a review
   */
  async deleteReview(id: string): Promise<void> {
    await this.delete(API_ENDPOINTS.reviews.adminDelete(id));
  }

  /**
   * Reply as admin
   */
  async replyAsAdmin(reviewId: string, content: string): Promise<Review> {
    const response = await this.post<{ review: Review }>(
      API_ENDPOINTS.reviews.reply(reviewId),
      { content },
    );
    return response.data.review;
  }
}

export const adminReviewService = new AdminReviewService();
