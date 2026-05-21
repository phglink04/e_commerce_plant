"use client";

import type { RatingSummary } from "@/types/review";

interface Props {
  summary: RatingSummary;
  canReview: boolean;
  onWriteReview: () => void;
  isLoggedIn: boolean;
}

function StarDisplay({ rating, size = 20 }: { rating: number; size?: number }) {
  return (
    <div className="star-display" style={{ fontSize: size }}>
      {[1, 2, 3, 4, 5].map((star) => (
        <span
          key={star}
          className={`star-display__star ${star <= Math.round(rating) ? "star-display__star--filled" : ""}`}
        >
          ★
        </span>
      ))}
    </div>
  );
}

export default function RatingSummaryHeader({ summary, canReview, onWriteReview, isLoggedIn }: Props) {
  const { averageRating, totalReviews, ratingDistribution } = summary;

  return (
    <div className="rating-summary">
      <div className="rating-summary__left">
        <div className="rating-summary__average">{averageRating.toFixed(1)}</div>
        <StarDisplay rating={averageRating} size={24} />
        <p className="rating-summary__total">{totalReviews} đánh giá</p>
        {isLoggedIn && canReview && (
          <button className="rating-summary__write-btn" onClick={onWriteReview}>
            ✍️ Viết Đánh Giá
          </button>
        )}
      </div>

      <div className="rating-summary__right">
        {[5, 4, 3, 2, 1].map((star) => {
          const count = ratingDistribution[star as keyof typeof ratingDistribution];
          const pct = totalReviews > 0 ? (count / totalReviews) * 100 : 0;
          return (
            <div key={star} className="rating-bar">
              <span className="rating-bar__label">{star} ★</span>
              <div className="rating-bar__track">
                <div
                  className="rating-bar__fill"
                  style={{ width: `${pct}%` }}
                />
              </div>
              <span className="rating-bar__count">{count}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
