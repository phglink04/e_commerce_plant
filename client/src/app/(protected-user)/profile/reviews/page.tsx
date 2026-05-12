"use client";

import ReviewList from "@/components/profile/reviews/ReviewList";

export default function ProfileReviewsPage() {
  return (
    <>
      <header className="pf-main__header">
        <h1 className="pf-main__title" id="profile-page-title">
          My Reviews
        </h1>
        <p className="pf-main__subtitle">
          View and manage your product reviews
        </p>
      </header>
      <div className="pf-main__content">
        <ReviewList />
      </div>
    </>
  );
}
