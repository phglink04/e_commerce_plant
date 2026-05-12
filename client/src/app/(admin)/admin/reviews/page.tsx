"use client";

import { useEffect, useState, useCallback } from "react";
import { adminReviewService } from "@/services/admin/review.service";
import type { Review } from "@/types/review";
import "@/components/reviews/reviews.css";

export default function AdminReviewsPage() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalResults, setTotalResults] = useState(0);

  // Filters
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [ratingFilter, setRatingFilter] = useState("");

  // Reply modal
  const [replyTarget, setReplyTarget] = useState<string | null>(null);
  const [replyText, setReplyText] = useState("");
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchReviews = useCallback(async () => {
    setLoading(true);
    try {
      const res = await adminReviewService.getReviews({
        page,
        limit: 15,
        search: search || undefined,
        status: statusFilter || undefined,
        rating: ratingFilter ? Number(ratingFilter) : undefined,
      });
      setReviews(res.items);
      setTotalPages(res.totalPages);
      setTotalResults(res.totalResults);
    } catch {
      setReviews([]);
    } finally {
      setLoading(false);
    }
  }, [page, search, statusFilter, ratingFilter]);

  useEffect(() => {
    fetchReviews();
  }, [fetchReviews]);

  const handleApprove = async (id: string) => {
    setActionLoading(id);
    try {
      await adminReviewService.approveReview(id);
      setReviews((prev) =>
        prev.map((r) => (r.id === id ? { ...r, isApproved: true } : r))
      );
    } catch {} finally { setActionLoading(null); }
  };

  const handleReject = async (id: string) => {
    setActionLoading(id);
    try {
      await adminReviewService.rejectReview(id);
      setReviews((prev) =>
        prev.map((r) => (r.id === id ? { ...r, isApproved: false } : r))
      );
    } catch {} finally { setActionLoading(null); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this review permanently?")) return;
    setActionLoading(id);
    try {
      await adminReviewService.deleteReview(id);
      setReviews((prev) => prev.filter((r) => r.id !== id));
      setTotalResults((prev) => prev - 1);
    } catch {} finally { setActionLoading(null); }
  };

  const handleReply = async () => {
    if (!replyTarget || !replyText.trim()) return;
    setActionLoading(replyTarget);
    try {
      const updated = await adminReviewService.replyAsAdmin(replyTarget, replyText.trim());
      setReviews((prev) => prev.map((r) => (r.id === replyTarget ? updated : r)));
      setReplyTarget(null);
      setReplyText("");
    } catch {} finally { setActionLoading(null); }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchReviews();
  };

  return (
    <div className="admin-reviews">
      <h1 className="admin-reviews__title">Review Moderation</h1>

      <form className="admin-reviews__filters" onSubmit={handleSearchSubmit}>
        <div className="admin-reviews__filter-group">
          <label className="admin-reviews__filter-label">Search</label>
          <input
            type="text"
            className="admin-reviews__filter-input"
            placeholder="Search reviews..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="admin-reviews__filter-group">
          <label className="admin-reviews__filter-label">Status</label>
          <select
            className="admin-reviews__filter-select"
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
          >
            <option value="">All</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
          </select>
        </div>
        <div className="admin-reviews__filter-group">
          <label className="admin-reviews__filter-label">Rating</label>
          <select
            className="admin-reviews__filter-select"
            value={ratingFilter}
            onChange={(e) => { setRatingFilter(e.target.value); setPage(1); }}
          >
            <option value="">All</option>
            {[5, 4, 3, 2, 1].map((r) => (
              <option key={r} value={r}>{r} ★</option>
            ))}
          </select>
        </div>
        <button type="submit" className="admin-reviews__btn admin-reviews__btn--approve" style={{ alignSelf: "flex-end" }}>
          Search
        </button>
      </form>

      <p style={{ fontSize: "0.85rem", color: "#6b7280", marginBottom: "0.75rem" }}>
        Total: {totalResults} reviews
      </p>

      {loading ? (
        <div className="admin-reviews__empty">Loading reviews...</div>
      ) : reviews.length === 0 ? (
        <div className="admin-reviews__empty">No reviews found</div>
      ) : (
        <div className="admin-reviews__table-wrap">
          <table className="admin-reviews__table">
            <thead>
              <tr>
                <th>User</th>
                <th>Rating</th>
                <th>Content</th>
                <th>Images</th>
                <th>Status</th>
                <th>Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {reviews.map((review) => (
                <tr key={review.id}>
                  <td>
                    <strong>{review.userName}</strong>
                    {review.isVerifiedPurchase && (
                      <span style={{ display: "block", fontSize: "0.7rem", color: "#16a34a" }}>✓ Verified</span>
                    )}
                  </td>
                  <td>
                    <span className="admin-reviews__stars">
                      {"★".repeat(review.rating)}{"☆".repeat(5 - review.rating)}
                    </span>
                  </td>
                  <td>
                    <div className="admin-reviews__content" title={review.content}>
                      {review.content || <em style={{ color: "#9ca3af" }}>No text</em>}
                    </div>
                  </td>
                  <td>{review.images.length > 0 ? `${review.images.length} 📷` : "—"}</td>
                  <td>
                    <span className={`admin-reviews__status ${review.isApproved ? "admin-reviews__status--approved" : "admin-reviews__status--pending"}`}>
                      {review.isApproved ? "Approved" : "Pending"}
                    </span>
                  </td>
                  <td style={{ whiteSpace: "nowrap", fontSize: "0.8rem", color: "#6b7280" }}>
                    {new Date(review.createdAt).toLocaleDateString()}
                  </td>
                  <td>
                    <div className="admin-reviews__actions-cell">
                      {!review.isApproved ? (
                        <button
                          className="admin-reviews__btn admin-reviews__btn--approve"
                          onClick={() => handleApprove(review.id)}
                          disabled={actionLoading === review.id}
                        >
                          Approve
                        </button>
                      ) : (
                        <button
                          className="admin-reviews__btn admin-reviews__btn--reject"
                          onClick={() => handleReject(review.id)}
                          disabled={actionLoading === review.id}
                        >
                          Reject
                        </button>
                      )}
                      <button
                        className="admin-reviews__btn admin-reviews__btn--reply"
                        onClick={() => { setReplyTarget(review.id); setReplyText(""); }}
                      >
                        Reply
                      </button>
                      <button
                        className="admin-reviews__btn admin-reviews__btn--delete"
                        onClick={() => handleDelete(review.id)}
                        disabled={actionLoading === review.id}
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {totalPages > 1 && (
        <div className="admin-reviews__pagination">
          <button
            className="review-pagination__btn"
            disabled={page <= 1}
            onClick={() => setPage(page - 1)}
          >
            ← Prev
          </button>
          <span style={{ fontSize: "0.85rem", color: "#6b7280" }}>
            Page {page} of {totalPages}
          </span>
          <button
            className="review-pagination__btn"
            disabled={page >= totalPages}
            onClick={() => setPage(page + 1)}
          >
            Next →
          </button>
        </div>
      )}

      {/* Reply Modal */}
      {replyTarget && (
        <div className="admin-reviews__reply-modal" onClick={() => setReplyTarget(null)}>
          <div className="admin-reviews__reply-box" onClick={(e) => e.stopPropagation()}>
            <h3>Reply as Admin</h3>
            <textarea
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              placeholder="Write your reply..."
              maxLength={2000}
            />
            <div className="admin-reviews__reply-box-actions">
              <button className="review-card__reply-cancel" onClick={() => setReplyTarget(null)}>
                Cancel
              </button>
              <button
                className="admin-reviews__btn admin-reviews__btn--approve"
                onClick={handleReply}
                disabled={!replyText.trim() || actionLoading === replyTarget}
              >
                {actionLoading === replyTarget ? "Sending..." : "Send Reply"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
