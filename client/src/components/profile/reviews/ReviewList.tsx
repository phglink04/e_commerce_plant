"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
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
  ShoppingBag,
  ShoppingCart,
  Camera,
} from "lucide-react";
import { useMyReviews } from "@/hooks/useProfile";
import { reviewService } from "@/services/review.service";
import { buildSlugAndId } from "@/lib/slug.utils";
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
    <div className="pf-stars" style={{ display: "flex", gap: "4px" }}>
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          size={16}
          className={`pf-star ${i <= rating ? "pf-star--filled" : ""}`}
          onClick={() => editable && onChange?.(i)}
          style={{
            cursor: editable ? "pointer" : "default",
            fill: i <= rating ? "#fbbf24" : "none",
            color: i <= rating ? "#fbbf24" : "rgba(255, 255, 255, 0.2)",
            transition: "all 0.15s ease",
          }}
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
            {new Date(review.createdAt).toLocaleDateString("vi-VN", {
              month: "short",
              day: "numeric",
              year: "numeric",
            })}
          </span>
        </div>
      </div>

      {review.product && (
        <div 
          className="pf-review-card__product-info"
          style={{
            display: "flex",
            alignItems: "center",
            gap: "12px",
            padding: "10px",
            backgroundColor: "#f9fafb",
            borderRadius: "6px",
            marginBottom: "12px",
            border: "1px solid #f3f4f6"
          }}
        >
          <img 
            src={review.product.imageCover} 
            alt={review.product.name} 
            style={{ 
              width: "48px", 
              height: "48px", 
              objectFit: "cover", 
              borderRadius: "4px" 
            }} 
          />
          <div style={{ flex: 1 }}>
            <h4 style={{ fontSize: "14px", fontWeight: "600", margin: 0, color: "#111827" }}>
              {review.product.name}
            </h4>
            <span style={{ fontSize: "12px", color: "#6b7280" }}>
              Đơn hàng: #{review.orderId.substring(review.orderId.length - 8).toUpperCase()}
            </span>
          </div>
        </div>
      )}

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
        <div className="pf-review-card__actions" style={{ display: "flex", gap: "8px" }}>
          {review.product && (
            review.product.availability === "Discontinued" ? (
              <span 
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-rose-600 bg-rose-50 border border-rose-200 rounded-lg shadow-sm"
                style={{ fontSize: "12px" }}
              >
                ⚠️ Sản phẩm đang tạm ngừng bán
              </span>
            ) : (
              <Link
                href={`/plant/${buildSlugAndId(review.product.slug, review.product.id)}`}
                className="pf-btn pf-btn--ghost pf-btn--sm"
                style={{
                  borderColor: "#10b981",
                  color: "#10b981",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "4px"
                }}
              >
                <ShoppingCart size={14} />
                Mua lại
              </Link>
            )
          )}
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
  const { reviews, loading, error, submitting, deleteReview, updateReview, refetch } =
    useMyReviews();

  const [activeTab, setActiveTab] = useState<"pending" | "completed">("pending");
  const [pendingReviews, setPendingReviews] = useState<any[]>([]);
  const [loadingPending, setLoadingPending] = useState(false);

  const [editingReview, setEditingReview] = useState<Review | null>(null);
  const [editRating, setEditRating] = useState(5);
  const [editContent, setEditContent] = useState("");
  const [editImages, setEditImages] = useState<string[]>([]);
  const [uploadingEdit, setUploadingEdit] = useState(false);

  const [creatingReview, setCreatingReview] = useState<any | null>(null);
  const [createRating, setCreateRating] = useState(5);
  const [createContent, setCreateContent] = useState("");
  const [createImages, setCreateImages] = useState<string[]>([]);
  const [submittingCreate, setSubmittingCreate] = useState(false);
  const [uploadingCreate, setUploadingCreate] = useState(false);

  const [toast, setToast] = useState("");
  const [toastType, setToastType] = useState<"success" | "error">("success");
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchPending = async () => {
    setLoadingPending(true);
    try {
      const data = await reviewService.getPendingReviews();
      setPendingReviews(data);
    } catch (err) {
      console.error("Lỗi khi tải sản phẩm chờ đánh giá:", err);
    } finally {
      setLoadingPending(false);
    }
  };

  useEffect(() => {
    fetchPending();
  }, []);

  const showToast = (msg: string, type: "success" | "error" = "success") => {
    setToast(msg);
    setToastType(type);
    setTimeout(() => setToast(""), 3000);
  };

  const handleCreateFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (createImages.length >= 3) {
      showToast("Tối đa 3 hình ảnh", "error");
      return;
    }

    setUploadingCreate(true);
    try {
      const res = await reviewService.uploadImage(file);
      setCreateImages([...createImages, res.publicUrl]);
      showToast("Tải ảnh lên thành công!");
    } catch (err: any) {
      console.error(err);
      showToast(err.message || "Tải ảnh lên thất bại", "error");
    } finally {
      setUploadingCreate(false);
      e.target.value = "";
    }
  };

  const handleRemoveCreateImage = (index: number) => {
    setCreateImages(createImages.filter((_, i) => i !== index));
  };

  const handleEditFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (editImages.length >= 3) {
      showToast("Tối đa 3 hình ảnh", "error");
      return;
    }

    setUploadingEdit(true);
    try {
      const res = await reviewService.uploadImage(file);
      setEditImages([...editImages, res.publicUrl]);
      showToast("Tải ảnh lên thành công!");
    } catch (err: any) {
      console.error(err);
      showToast(err.message || "Tải ảnh lên thất bại", "error");
    } finally {
      setUploadingEdit(false);
      e.target.value = "";
    }
  };

  const handleRemoveEditImage = (index: number) => {
    setEditImages(editImages.filter((_, i) => i !== index));
  };

  const handleEdit = (review: Review) => {
    setEditingReview(review);
    setEditRating(review.rating);
    setEditContent(review.content);
    setEditImages(review.images || []);
  };

  const handleSaveEdit = async () => {
    if (!editingReview) return;
    try {
      await updateReview(editingReview.id, {
        rating: editRating,
        content: editContent,
        images: editImages,
      });
      setEditingReview(null);
      showToast("Đánh giá đã cập nhật thành công!");
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

  const handleCreateReview = async () => {
    if (!creatingReview) return;
    setSubmittingCreate(true);
    try {
      await reviewService.createReview({
        productId: creatingReview.product.id,
        orderId: creatingReview.orderId,
        rating: createRating,
        content: createContent,
        images: createImages,
      });
      showToast("Đăng đánh giá thành công! Cảm ơn bạn.");
      setCreatingReview(null);
      setCreateContent("");
      setCreateRating(5);
      setCreateImages([]);
      // Refresh lists
      await refetch();
      await fetchPending();
    } catch (err: any) {
      showToast(err?.message || "Đăng đánh giá thất bại", "error");
    } finally {
      setSubmittingCreate(false);
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

      {/* Tabs */}
      <div
        className="pf-reviews-tabs"
        style={{
          display: "flex",
          gap: "8px",
          marginBottom: "24px",
          background: "rgba(255, 255, 255, 0.03)",
          padding: "4px",
          borderRadius: "10px",
          border: "1px solid rgba(255, 255, 255, 0.06)",
        }}
      >
        <button
          type="button"
          onClick={() => setActiveTab("pending")}
          style={{
            flex: 1,
            padding: "10px 14px",
            borderRadius: "8px",
            border: "none",
            background: activeTab === "pending" ? "#10b981" : "transparent",
            color: activeTab === "pending" ? "#ffffff" : "#94a3b8",
            fontWeight: "600",
            fontSize: "14px",
            cursor: "pointer",
            transition: "all 0.25s ease",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "8px",
          }}
        >
          <ShoppingBag size={16} />
          Chờ đánh giá ({pendingReviews.length})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("completed")}
          style={{
            flex: 1,
            padding: "10px 14px",
            borderRadius: "8px",
            border: "none",
            background: activeTab === "completed" ? "#10b981" : "transparent",
            color: activeTab === "completed" ? "#ffffff" : "#94a3b8",
            fontWeight: "600",
            fontSize: "14px",
            cursor: "pointer",
            transition: "all 0.25s ease",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "8px",
          }}
        >
          <Star size={16} />
          Đánh giá của tôi ({reviews.length})
        </button>
      </div>

      {/* Edit Modal */}
      {editingReview && (
        <div className="pf-modal-backdrop" onClick={() => setEditingReview(null)}>
          <div className="pf-modal" onClick={(e) => e.stopPropagation()}>
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
              <div className="pf-form__group" style={{ marginTop: "16px" }}>
                <label className="pf-form__label">Hình ảnh (tối đa 3)</label>
                <div style={{ display: "flex", gap: "12px", alignItems: "center", marginTop: "8px", flexWrap: "wrap" }}>
                  {/* Uploaded Images Previews */}
                  {editImages.map((url, i) => (
                    <div
                      key={i}
                      style={{
                        position: "relative",
                        width: "80px",
                        height: "80px",
                        borderRadius: "8px",
                        overflow: "hidden",
                        border: "1px solid rgba(255, 255, 255, 0.1)",
                        background: "rgba(255, 255, 255, 0.02)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center"
                      }}
                    >
                      <img
                        src={url}
                        alt={`Edit Preview ${i + 1}`}
                        style={{ width: "100%", height: "100%", objectFit: "cover" }}
                      />
                      <button
                        type="button"
                        onClick={() => handleRemoveEditImage(i)}
                        style={{
                          position: "absolute",
                          top: "4px",
                          right: "4px",
                          background: "rgba(0, 0, 0, 0.6)",
                          color: "#fff",
                          border: "none",
                          borderRadius: "50%",
                          width: "20px",
                          height: "20px",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: "12px",
                          cursor: "pointer",
                        }}
                      >
                        ✕
                      </button>
                    </div>
                  ))}

                  {/* Upload Trigger Card */}
                  {editImages.length < 3 && (
                    <label
                      style={{
                        width: "80px",
                        height: "80px",
                        borderRadius: "8px",
                        border: "2px dashed rgba(255, 255, 255, 0.15)",
                        background: "rgba(255, 255, 255, 0.02)",
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        justifyContent: "center",
                        cursor: uploadingEdit ? "not-allowed" : "pointer",
                        gap: "6px",
                        color: "#94a3b8",
                        userSelect: "none"
                      }}
                    >
                      {uploadingEdit ? (
                        <>
                          <Loader2 size={20} className="pf-spin" style={{ color: "#10b981" }} />
                          <span style={{ fontSize: "11px", fontWeight: "500" }}>Đang tải...</span>
                        </>
                      ) : (
                        <>
                          <Camera size={20} />
                          <span style={{ fontSize: "11px", fontWeight: "600" }}>
                            {editImages.length}/3
                          </span>
                        </>
                      )}
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleEditFileChange}
                        style={{ display: "none" }}
                        disabled={uploadingEdit}
                      />
                    </label>
                  )}
                </div>
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

      {/* Create Review Modal */}
      {creatingReview && (
        <div className="pf-modal-backdrop" onClick={() => setCreatingReview(null)}>
          <div className="pf-modal" onClick={(e) => e.stopPropagation()}>
            <div className="pf-modal__header">
              <h3>Viết Đánh Giá Sản Phẩm</h3>
              <button
                onClick={() => setCreatingReview(null)}
                className="pf-modal__close"
              >
                <X size={18} />
              </button>
            </div>
            <div className="pf-modal__body">
              {/* Product Info Preview */}
              <div
                style={{
                  display: "flex",
                  gap: "12px",
                  padding: "12px",
                  borderRadius: "8px",
                  background: "rgba(255, 255, 255, 0.02)",
                  border: "1px solid rgba(255, 255, 255, 0.06)",
                  marginBottom: "20px",
                  alignItems: "center",
                }}
              >
                {creatingReview.product.image ? (
                  <img
                    src={creatingReview.product.image}
                    alt={creatingReview.product.name}
                    style={{
                      width: "50px",
                      height: "50px",
                      borderRadius: "6px",
                      objectFit: "cover",
                    }}
                  />
                ) : (
                  <div
                    style={{
                      width: "50px",
                      height: "50px",
                      borderRadius: "6px",
                      background: "rgba(255, 255, 255, 0.05)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: "#64748b",
                    }}
                  >
                    <ShoppingBag size={20} />
                  </div>
                )}
                <div>
                  <h4 style={{ margin: 0, fontSize: "14px", color: "#f8fafc" }}>
                    {creatingReview.product.name}
                  </h4>
                  <p style={{ margin: "2px 0 0", fontSize: "12px", color: "#34d399", fontWeight: "600" }}>
                    {creatingReview.product.price.toLocaleString("vi-VN")} đ
                  </p>
                </div>
              </div>

              <div className="pf-form__group">
                <label className="pf-form__label">Đánh giá sản phẩm *</label>
                <StarRating
                  rating={createRating}
                  editable
                  onChange={setCreateRating}
                />
              </div>

              <div className="pf-form__group">
                <label className="pf-form__label">Nhận xét của bạn *</label>
                <textarea
                  className="pf-form__textarea"
                  rows={4}
                  value={createContent}
                  onChange={(e) => setCreateContent(e.target.value)}
                  placeholder="Hãy chia sẻ trải nghiệm thực tế về sản phẩm này nhé (chất lượng sản phẩm, cách đóng gói hàng, dịch vụ vận chuyển...)"
                  required
                />
              </div>
              <div className="pf-form__group" style={{ marginTop: "16px" }}>
                <label className="pf-form__label">Hình ảnh (tối đa 3)</label>
                <div style={{ display: "flex", gap: "12px", alignItems: "center", marginTop: "8px", flexWrap: "wrap" }}>
                  {/* Uploaded Images Previews */}
                  {createImages.map((url, i) => (
                    <div
                      key={i}
                      style={{
                        position: "relative",
                        width: "80px",
                        height: "80px",
                        borderRadius: "8px",
                        overflow: "hidden",
                        border: "1px solid rgba(255, 255, 255, 0.1)",
                        background: "rgba(255, 255, 255, 0.02)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center"
                      }}
                    >
                      <img
                        src={url}
                        alt={`Create Preview ${i + 1}`}
                        style={{ width: "100%", height: "100%", objectFit: "cover" }}
                      />
                      <button
                        type="button"
                        onClick={() => handleRemoveCreateImage(i)}
                        style={{
                          position: "absolute",
                          top: "4px",
                          right: "4px",
                          background: "rgba(0, 0, 0, 0.6)",
                          color: "#fff",
                          border: "none",
                          borderRadius: "50%",
                          width: "20px",
                          height: "20px",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: "12px",
                          cursor: "pointer",
                        }}
                      >
                        ✕
                      </button>
                    </div>
                  ))}

                  {/* Upload Trigger Card */}
                  {createImages.length < 3 && (
                    <label
                      style={{
                        width: "80px",
                        height: "80px",
                        borderRadius: "8px",
                        border: "2px dashed rgba(255, 255, 255, 0.15)",
                        background: "rgba(255, 255, 255, 0.02)",
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        justifyContent: "center",
                        cursor: uploadingCreate ? "not-allowed" : "pointer",
                        gap: "6px",
                        color: "#94a3b8",
                        userSelect: "none"
                      }}
                    >
                      {uploadingCreate ? (
                        <>
                          <Loader2 size={20} className="pf-spin" style={{ color: "#10b981" }} />
                          <span style={{ fontSize: "11px", fontWeight: "500" }}>Đang tải...</span>
                        </>
                      ) : (
                        <>
                          <Camera size={20} />
                          <span style={{ fontSize: "11px", fontWeight: "600" }}>
                            {createImages.length}/3
                          </span>
                        </>
                      )}
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleCreateFileChange}
                        style={{ display: "none" }}
                        disabled={uploadingCreate}
                      />
                    </label>
                  )}
                </div>
              </div>
            </div>
            <div className="pf-modal__footer">
              <button
                onClick={() => setCreatingReview(null)}
                className="pf-btn pf-btn--ghost"
                disabled={submittingCreate}
              >
                Hủy
              </button>
              <button
                onClick={handleCreateReview}
                className="pf-btn pf-btn--primary"
                disabled={submittingCreate || !createContent.trim()}
              >
                {submittingCreate ? (
                  <>
                    <Loader2 size={16} className="pf-spin" />
                    Đang gửi…
                  </>
                ) : (
                  "Đăng Đánh Giá"
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TAB 1: Pending Reviews */}
      {activeTab === "pending" && (
        <div className="pf-reviews__pending-section">
          {loadingPending ? (
            <div className="pf-skeleton-wrap">
              {[1, 2].map((i) => (
                <div key={i} className="pf-skeleton pf-skeleton--card" style={{ height: "120px" }} />
              ))}
            </div>
          ) : pendingReviews.length === 0 ? (
            <div className="pf-empty" style={{ padding: "40px 20px" }}>
              <ShoppingBag size={48} style={{ color: "#64748b", marginBottom: "16px" }} />
              <h3>Chưa có sản phẩm chờ đánh giá</h3>
              <p style={{ maxWidth: "400px", margin: "8px auto 0", fontSize: "14px" }}>
                Khi bạn hoàn tất mua hàng và đơn hàng được giao thành công, các sản phẩm sẽ xuất hiện ở đây để bạn đánh giá.
              </p>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              {pendingReviews.map((item, idx) => (
                <div
                  key={idx}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    padding: "16px",
                    borderRadius: "12px",
                    background: "rgba(255, 255, 255, 0.02)",
                    border: "1px solid rgba(255, 255, 255, 0.06)",
                    gap: "16px",
                    flexWrap: "wrap",
                  }}
                >
                  <div style={{ display: "flex", gap: "16px", alignItems: "center", flex: 1, minWidth: "240px" }}>
                    {item.product.image ? (
                      <img
                        src={item.product.image}
                        alt={item.product.name}
                        style={{
                          width: "60px",
                          height: "60px",
                          borderRadius: "8px",
                          objectFit: "cover",
                        }}
                      />
                    ) : (
                      <div
                        style={{
                          width: "60px",
                          height: "60px",
                          borderRadius: "8px",
                          background: "rgba(255, 255, 255, 0.05)",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          color: "#64748b",
                        }}
                      >
                        <ShoppingBag size={24} />
                      </div>
                    )}
                    <div>
                      <h4 style={{ margin: 0, fontSize: "15px", color: "#f8fafc", fontWeight: 600 }}>
                        {item.product.name}
                      </h4>
                      <p style={{ margin: "4px 0 0", fontSize: "13px", color: "#94a3b8" }}>
                        Đơn hàng giao thành công
                      </p>
                      <p style={{ margin: "2px 0 0", fontSize: "12px", color: "#34d399", fontWeight: "600" }}>
                        {item.product.price.toLocaleString("vi-VN")} đ
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setCreatingReview(item);
                      setCreateRating(5);
                      setCreateContent("");
                      setCreateImages([]);
                    }}
                    className="pf-btn pf-btn--primary"
                    style={{
                      height: "38px",
                      padding: "0 16px",
                      fontSize: "13.5px",
                    }}
                  >
                    Viết đánh giá
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: Completed Reviews */}
      {activeTab === "completed" && (
        <div className="pf-reviews__completed-section">
          {reviews.length === 0 ? (
            <div className="pf-empty">
              <Star size={48} />
              <h3>Chưa có đánh giá nào</h3>
              <p>Các đánh giá bạn đã viết sẽ xuất hiện tại đây.</p>
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
      )}
    </div>
  );
}
