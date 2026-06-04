"use client";

import ReviewList from "@/components/profile/reviews/ReviewList";

export default function ProfileReviewsPage() {
  return (
    <>
      <header className="pf-main__header">
        <h1 className="pf-main__title" id="profile-page-title">
          Đánh giá của tôi
        </h1>
        <p className="pf-main__subtitle">
          Xem và quản lý các đánh giá sản phẩm của bạn
        </p>
      </header>
      <div className="pf-main__content">
        <ReviewList />
      </div>
    </>
  );
}
