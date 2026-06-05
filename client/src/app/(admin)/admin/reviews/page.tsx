"use client";

import { useEffect, useState, useCallback } from "react";
import { adminReviewService } from "@/services/admin/review.service";
import type { Review } from "@/types/review";
import ConfirmDialog from "@/components/admin/ui/confirm-dialog";
import "@/components/reviews/reviews.css";

export default function AdminReviewsPage() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalResults, setTotalResults] = useState(0);

  // Filters
  const [search, setSearch] = useState("");
  const [ratingFilter, setRatingFilter] = useState("");

  // Reply modal
  const [replyTarget, setReplyTarget] = useState<string | null>(null);
  const [replyText, setReplyText] = useState("");
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Delete target
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);

  const fetchReviews = useCallback(async () => {
    setLoading(true);
    try {
      const res = await adminReviewService.getReviews({
        page,
        limit: 15,
        search: search || undefined,
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
  }, [page, search, ratingFilter]);

  useEffect(() => {
    fetchReviews();
  }, [fetchReviews]);

  const handleDelete = async () => {
    if (!deleteTargetId) return;
    setActionLoading(deleteTargetId);
    try {
      await adminReviewService.deleteReview(deleteTargetId);
      setReviews((prev) => prev.filter((r) => r.id !== deleteTargetId));
      setTotalResults((prev) => prev - 1);
      setDeleteTargetId(null);
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
      <h1 className="admin-reviews__title">Quản lý Đánh giá</h1>

      <form className="admin-reviews__filters" onSubmit={handleSearchSubmit}>
        <div className="admin-reviews__filter-group">
          <label className="admin-reviews__filter-label">Tìm kiếm</label>
          <input
            type="text"
            className="admin-reviews__filter-input"
            placeholder="Tìm theo tên người dùng, nội dung..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="admin-reviews__filter-group">
          <label className="admin-reviews__filter-label">Số sao</label>
          <select
            className="admin-reviews__filter-select"
            value={ratingFilter}
            onChange={(e) => { setRatingFilter(e.target.value); setPage(1); }}
          >
            <option value="">Tất cả</option>
            {[5, 4, 3, 2, 1].map((r) => (
              <option key={r} value={r}>{r} ★</option>
            ))}
          </select>
        </div>
        <button type="submit" className="admin-reviews__btn admin-reviews__btn--approve" style={{ alignSelf: "flex-end" }}>
          Tìm kiếm
        </button>
      </form>

      <p style={{ fontSize: "0.85rem", color: "#6b7280", marginBottom: "0.75rem" }}>
        Tổng cộng: {totalResults} đánh giá
      </p>

      {loading ? (
        <div className="admin-reviews__empty">Đang tải đánh giá...</div>
      ) : reviews.length === 0 ? (
        <div className="admin-reviews__empty">Không tìm thấy đánh giá nào</div>
      ) : (
        <div className="admin-reviews__table-wrap">
          <table className="admin-reviews__table">
            <thead>
              <tr>
                <th>Người dùng</th>
                <th>Số sao</th>
                <th>Nội dung</th>
                <th>Hình ảnh</th>
                <th>Ngày đăng</th>
                <th>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {reviews.map((review) => (
                <tr key={review.id}>
                  <td>
                    <strong>{review.userName}</strong>
                    {review.isVerifiedPurchase && (
                      <span style={{ display: "block", fontSize: "0.7rem", color: "#16a34a" }}>✓ Đã mua hàng</span>
                    )}
                  </td>
                  <td>
                    <span className="admin-reviews__stars">
                      {"★".repeat(review.rating)}{"☆".repeat(5 - review.rating)}
                    </span>
                  </td>
                  <td>
                    <div className="admin-reviews__content" title={review.content}>
                      {review.content || <em style={{ color: "#9ca3af" }}>Không có nội dung</em>}
                    </div>
                  </td>
                  <td>{review.images.length > 0 ? `${review.images.length} 📷` : "—"}</td>
                  <td style={{ whiteSpace: "nowrap", fontSize: "0.8rem", color: "#6b7280" }}>
                    {new Date(review.createdAt).toLocaleDateString("vi-VN")}
                  </td>
                  <td>
                    <div className="admin-reviews__actions-cell">
                      <button
                        className="admin-reviews__btn admin-reviews__btn--reply"
                        onClick={() => { setReplyTarget(review.id); setReplyText(""); }}
                      >
                        Trả lời
                      </button>
                      <button
                        className="admin-reviews__btn admin-reviews__btn--delete"
                        onClick={() => setDeleteTargetId(review.id)}
                        disabled={actionLoading === review.id}
                      >
                        Xóa
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
            ← Trước
          </button>
          <span style={{ fontSize: "0.85rem", color: "#6b7280" }}>
            Trang {page} / {totalPages}
          </span>
          <button
            className="review-pagination__btn"
            disabled={page >= totalPages}
            onClick={() => setPage(page + 1)}
          >
            Tiếp →
          </button>
        </div>
      )}

      {/* Reply Modal */}
      {replyTarget && (
        <div className="admin-reviews__reply-modal" onClick={() => setReplyTarget(null)}>
          <div className="admin-reviews__reply-box" onClick={(e) => e.stopPropagation()}>
            <h3>Trả lời đánh giá</h3>
            <textarea
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              placeholder="Viết câu trả lời của bạn..."
              maxLength={2000}
            />
            <div className="admin-reviews__reply-box-actions">
              <button className="review-card__reply-cancel" onClick={() => setReplyTarget(null)}>
                Hủy
              </button>
              <button
                className="admin-reviews__btn admin-reviews__btn--approve"
                onClick={handleReply}
                disabled={!replyText.trim() || actionLoading === replyTarget}
              >
                {actionLoading === replyTarget ? "Đang gửi..." : "Gửi trả lời"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirm Dialog */}
      <ConfirmDialog
        title="Xóa đánh giá"
        description="Bạn có chắc chắn muốn xóa đánh giá này? Hành động này không thể hoàn tác."
        confirmLabel="Xóa"
        cancelLabel="Hủy"
        open={!!deleteTargetId}
        loading={actionLoading === deleteTargetId}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTargetId(null)}
        variant="danger"
      />
    </div>
  );
}
