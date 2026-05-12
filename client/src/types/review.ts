/**
 * Review Types
 * Type definitions for the review & comment system
 */

export interface ReviewReply {
  userId: string;
  userName: string;
  userAvatar: string;
  content: string;
  isAdmin: boolean;
  createdAt: string;
}

export interface Review {
  id: string;
  userId: string;
  userName: string;
  userAvatar: string;
  productId: string;
  orderId: string;
  rating: number;
  content: string;
  images: string[];
  isVerifiedPurchase: boolean;
  isApproved: boolean;
  likes: number;
  likedBy: string[];
  replies: ReviewReply[];
  createdAt: string;
  updatedAt: string;
}

export interface RatingSummary {
  averageRating: number;
  totalReviews: number;
  ratingDistribution: {
    1: number;
    2: number;
    3: number;
    4: number;
    5: number;
  };
  withImages: number;
}

export interface CreateReviewPayload {
  productId: string;
  orderId: string;
  rating: number;
  content?: string;
  images?: string[];
}

export interface CanReviewResponse {
  canReview: boolean;
  reason?: string;
  orderId?: string;
}
