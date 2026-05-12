"use client";

import { useEffect, useState, useCallback } from "react";
import { reviewService } from "@/services/review.service";
import { useAuthStore } from "@/store/auth-store";
import type { Review, RatingSummary, CanReviewResponse } from "@/types/review";
import RatingSummaryHeader from "./RatingSummaryHeader";
import ReviewFilters from "./ReviewFilters";
import ReviewCard from "./ReviewCard";
import ReviewForm from "./ReviewForm";
import ReviewSkeleton from "./ReviewSkeleton";

interface Props {
  productId: string;
}

export default function ReviewSection({ productId }: Props) {
  const { user, token } = useAuthStore();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [summary, setSummary] = useState<RatingSummary | null>(null);
  const [canReviewData, setCanReviewData] = useState<CanReviewResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalResults, setTotalResults] = useState(0);
  const [showForm, setShowForm] = useState(false);

  // Filters
  const [filterRating, setFilterRating] = useState<number | undefined>();
  const [filterWithImages, setFilterWithImages] = useState(false);
  const [filterVerified, setFilterVerified] = useState(false);
  const [sortBy, setSortBy] = useState("newest");

  const fetchReviews = useCallback(async () => {
    setLoading(true);
    try {
      const res = await reviewService.getReviews({
        productId,
        page,
        limit: 5,
        rating: filterRating,
        withImages: filterWithImages,
        verifiedOnly: filterVerified,
        sort: sortBy,
      });
      setReviews(res.items);
      setTotalPages(res.totalPages);
      setTotalResults(res.totalResults);
    } catch {
      setReviews([]);
    } finally {
      setLoading(false);
    }
  }, [productId, page, filterRating, filterWithImages, filterVerified, sortBy]);

  const fetchSummary = useCallback(async () => {
    try {
      const data = await reviewService.getRatingSummary(productId);
      setSummary(data);
    } catch {
      setSummary(null);
    }
  }, [productId]);

  const checkCanReview = useCallback(async () => {
    if (!token) return;
    try {
      const data = await reviewService.canReview(productId);
      setCanReviewData(data);
    } catch {
      setCanReviewData(null);
    }
  }, [productId, token]);

  useEffect(() => {
    fetchSummary();
    checkCanReview();
  }, [fetchSummary, checkCanReview]);

  useEffect(() => {
    fetchReviews();
  }, [fetchReviews]);

  const handleReviewSubmitted = () => {
    setShowForm(false);
    setPage(1);
    fetchReviews();
    fetchSummary();
    checkCanReview();
  };

  const handleLike = async (reviewId: string) => {
    if (!token) return;
    try {
      const res = await reviewService.toggleLike(reviewId);
      setReviews((prev) =>
        prev.map((r) =>
          r.id === reviewId
            ? { ...r, likes: res.likes, likedBy: res.isLiked
                ? [...r.likedBy, user?.id || ""]
                : r.likedBy.filter((id) => id !== user?.id) }
            : r
        )
      );
    } catch {}
  };

  const handleReply = async (reviewId: string, content: string) => {
    if (!token) return;
    try {
      const updated = await reviewService.addReply(reviewId, content);
      setReviews((prev) =>
        prev.map((r) => (r.id === reviewId ? updated : r))
      );
    } catch {}
  };

  const handleFilterChange = (rating?: number) => {
    setFilterRating(rating);
    setPage(1);
  };

  return (
    <section className="review-section" id="reviews">
      <h2 className="review-section__title">Customer Reviews</h2>

      {summary && (
        <RatingSummaryHeader
          summary={summary}
          canReview={canReviewData?.canReview || false}
          onWriteReview={() => setShowForm(true)}
          isLoggedIn={!!token}
        />
      )}

      {showForm && canReviewData?.canReview && canReviewData.orderId && (
        <ReviewForm
          productId={productId}
          orderId={canReviewData.orderId}
          onSubmitted={handleReviewSubmitted}
          onCancel={() => setShowForm(false)}
        />
      )}

      <ReviewFilters
        activeRating={filterRating}
        withImages={filterWithImages}
        verifiedOnly={filterVerified}
        sortBy={sortBy}
        onRatingFilter={handleFilterChange}
        onWithImagesToggle={() => { setFilterWithImages(!filterWithImages); setPage(1); }}
        onVerifiedToggle={() => { setFilterVerified(!filterVerified); setPage(1); }}
        onSortChange={(s) => { setSortBy(s); setPage(1); }}
        totalResults={totalResults}
      />

      <div className="review-section__list">
        {loading ? (
          Array.from({ length: 3 }).map((_, i) => <ReviewSkeleton key={i} />)
        ) : reviews.length === 0 ? (
          <div className="review-section__empty">
            <p>No reviews yet. Be the first to review this product!</p>
          </div>
        ) : (
          reviews.map((review) => (
            <ReviewCard
              key={review.id}
              review={review}
              currentUserId={user?.id}
              onLike={handleLike}
              onReply={handleReply}
              isLoggedIn={!!token}
            />
          ))
        )}
      </div>

      {totalPages > 1 && (
        <div className="review-section__pagination">
          <button
            disabled={page <= 1}
            onClick={() => setPage(page - 1)}
            className="review-pagination__btn"
          >
            ← Previous
          </button>
          <span className="review-pagination__info">
            Page {page} of {totalPages}
          </span>
          <button
            disabled={page >= totalPages}
            onClick={() => setPage(page + 1)}
            className="review-pagination__btn"
          >
            Next →
          </button>
        </div>
      )}
    </section>
  );
}
