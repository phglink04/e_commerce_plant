"use client";

export default function ReviewSkeleton() {
  return (
    <div className="review-skeleton">
      <div className="review-skeleton__header">
        <div className="review-skeleton__avatar" />
        <div className="review-skeleton__meta">
          <div className="review-skeleton__name" />
          <div className="review-skeleton__stars" />
        </div>
      </div>
      <div className="review-skeleton__line review-skeleton__line--long" />
      <div className="review-skeleton__line review-skeleton__line--medium" />
      <div className="review-skeleton__line review-skeleton__line--short" />
    </div>
  );
}
