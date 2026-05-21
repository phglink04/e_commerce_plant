"use client";

import { useState } from "react";
import {
  Star,
  Edit3,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  MessageSquare,
  Image as ImageIcon,
  Save,
  X,
} from "lucide-react";
import { useMyReviews } from "@/hooks/useProfile";
import type { Review } from "@/types";

function StarRating({
  rating,
  editable,
  onChange,
}: {
  rating: number;
  editable?: boolean;
  onChange?: (r: number) => void;
}) {
  return (
    <div className="pf-stars">
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          size={16}
          className={`pf-star ${i <= rating ? "pf-star--filled" : ""}`}
          onClick={() => editable && onChange?.(i)}
          style={{ cursor: editable ? "pointer" : "default" }}
        />
      ))}
    </div>
  );
}

function ReviewCard({
  review,
  onEdit,
  onDelete,
  deleting,
}: {
  review: Review;
  onEdit: (r: Review) => void;
  onDelete: (id: string) => void;
  deleting: boolean;
}) {
  return (
    <div className="pf-review-card" id={`review-${review.id}`}>
      <div className="pf-review-card__header">
        <div className="pf-review-card__rating">
          <StarRating rating={review.rating} />
          <span className="pf-review-card__date">
            {new Date(review.createdAt).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
              year: "numeric",
            })}
          </span>
        </div>
        <div className="pf-review-card__meta">
          {!review.isApproved && (
            <span className="pf-review-card__pending">
              <AlertTriangle size={12} />
              Đang chờ duyệt
            </span>
          )}
          {review.isVerifiedPurchase && (
            <span className="pf-review-card__verified">
              <CheckCircle2 size={12} />
              Đã xác thực
            </span>
          )}
        </div>
      </div>

      {review.content && (
        <p className="pf-review-card__content">{review.content}</p>
      )}

      {review.images && review.images.length > 0 && (
        <div className="pf-review-card__images">
          {review.images.map((img, i) => (
            <img key={i} src={img} alt={`Review image ${i + 1}`} />
          ))}
        </div>
      )}

      <div className="pf-review-card__footer">
        <div className="pf-review-card__stats">
          <span>
            <MessageSquare size={14} />
            {review.replies?.length || 0} trả lời
          </span>
          <span>
            👍 {review.likes || 0} lượt thích
          </span>
        </div>
        <div className="pf-review-card__actions">
          <button
            onClick={() => onEdit(review)}
            className="pf-btn pf-btn--ghost pf-btn--sm"
          >
            <Edit3 size={14} />
            Sửa
          </button>
          <button
            onClick={() => onDelete(review.id)}
            className="pf-btn pf-btn--ghost pf-btn--sm pf-btn--danger-text"
            disabled={deleting}
          >
            {deleting ? (
              <Loader2 size={14} className="pf-spin" />
            ) : (
              <Trash2 size={14} />
            )}
            Xóa
          </button>
        </div>
      </div>
    </div>
  );
}

export default function ReviewList() {
  const { reviews, loading, error, submitting, deleteReview, updateReview } =
    useMyReviews();

  const [editingReview, setEditingReview] = useState<Review | null>(null);
  const [editRating, setEditRating] = useState(5);
  const [editContent, setEditContent] = useState("");
  const [toast, setToast] = useState("");
  const [toastType, setToastType] = useState<"success" | "error">("success");
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const showToast = (msg: string, type: "success" | "error" = "success") => {
    setToast(msg);
    setToastType(type);
    setTimeout(() => setToast(""), 3000);
  };

  const handleEdit = (review: Review) => {
    setEditingReview(review);
    setEditRating(review.rating);
    setEditContent(review.content);
  };

  const handleSaveEdit = async () => {
    if (!editingReview) return;
    try {
      await updateReview(editingReview.id, {
        rating: editRating,
        content: editContent,
      });
      setEditingReview(null);
      showToast("Đánh giá đã cập nhật (chờ duyệt lại)");
    } catch {
      showToast("Cập nhật đánh giá thất bại", "error");
    }
  };

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    try {
      await deleteReview(id);
      showToast("Đã xóa đánh giá");
    } catch {
      showToast("Xóa đánh giá thất bại", "error");
    } finally {
      setDeletingId(null);
    }
  };

  if (loading) {
    return (
      <div className="pf-skeleton-wrap">
        {[1, 2, 3].map((i) => (
          <div key={i} className="pf-skeleton pf-skeleton--card" />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="pf-empty">
        <AlertTriangle size={48} />
        <h3>Không thể tải đánh giá</h3>
        <p>{error.message}</p>
      </div>
    );
  }

  return (
    <div className="pf-reviews" id="review-list">
      {toast && (
        <div className={`pf-toast pf-toast--${toastType}`} role="alert">
          <CheckCircle2 size={18} />
          <span>{toast}</span>
        </div>
      )}

      {/* Edit Modal */}
      {editingReview && (
        <div className="pf-modal-backdrop" onClick={() => setEditingReview(null)}>
          <div
            className="pf-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="pf-modal__header">
              <h3>Chỉnh Sửa Đánh Giá</h3>
              <button
                onClick={() => setEditingReview(null)}
                className="pf-modal__close"
              >
                <X size={18} />
              </button>
            </div>
            <div className="pf-modal__body">
              <div className="pf-form__group">
                <label className="pf-form__label">Đánh giá sao</label>
                <StarRating
                  rating={editRating}
                  editable
                  onChange={setEditRating}
                />
              </div>
              <div className="pf-form__group">
                <label className="pf-form__label">Nhận xét</label>
                <textarea
                  className="pf-form__textarea"
                  rows={4}
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                  placeholder="Viết đánh giá của bạn..."
                />
              </div>
            </div>
            <div className="pf-modal__footer">
              <button
                onClick={() => setEditingReview(null)}
                className="pf-btn pf-btn--ghost"
              >
                Hủy
              </button>
              <button
                onClick={handleSaveEdit}
                className="pf-btn pf-btn--primary"
                disabled={submitting}
                id="save-review-edit"
              >
                {submitting ? (
                  <>
                    <Loader2 size={16} className="pf-spin" />
                    Đang lưu…
                  </>
                ) : (
                  <>
                    <Save size={16} />
                    Lưu Thay Đổi
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reviews */}
      {reviews.length === 0 ? (
        <div className="pf-empty">
          <Star size={48} />
          <h3>Chưa có đánh giá</h3>
          <p>Đánh giá sản phẩm của bạn sẽ xuất hiện tại đây.</p>
        </div>
      ) : (
        <div className="pf-reviews__list">
          {reviews.map((review) => (
            <ReviewCard
              key={review.id}
              review={review}
              onEdit={handleEdit}
              onDelete={handleDelete}
              deleting={deletingId === review.id}
            />
          ))}
        </div>
      )}
    </div>
  );
}
