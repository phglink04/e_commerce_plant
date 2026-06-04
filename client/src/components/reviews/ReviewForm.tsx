"use client";

import { useState } from "react";
import { reviewService } from "@/services/review.service";
import { Camera, Loader2 } from "lucide-react";

interface Props {
  productId: string;
  orderId: string;
  onSubmitted: () => void;
  onCancel: () => void;
}

export default function ReviewForm({ productId, orderId, onSubmitted, onCancel }: Props) {
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [content, setContent] = useState("");
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (imageUrls.length >= 3) {
      setError("Tối đa 3 hình ảnh");
      return;
    }

    setUploadingImage(true);
    setError("");
    try {
      const res = await reviewService.uploadImage(file);
      setImageUrls([...imageUrls, res.publicUrl]);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Tải ảnh lên thất bại");
    } finally {
      setUploadingImage(false);
      e.target.value = "";
    }
  };

  const handleRemoveImage = (index: number) => {
    setImageUrls(imageUrls.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    setError("");
    if (rating === 0) { setError("Vui lòng chọn đánh giá sao"); return; }
    if (!content.trim() && imageUrls.length === 0) {
      setError("Vui lòng viết nhận xét hoặc thêm hình ảnh");
      return;
    }

    setSubmitting(true);
    try {
      await reviewService.createReview({
        productId,
        orderId,
        rating,
        content: content.trim() || undefined,
        images: imageUrls.length > 0 ? imageUrls : undefined,
      });
      onSubmitted();
    } catch (err: any) {
      setError(err?.message || "Gửi đánh giá thất bại");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="review-form">
      <h3 className="review-form__title">Viết Đánh Giá</h3>

      <div className="review-form__rating">
        <label className="review-form__label">Đánh giá sao</label>
        <div className="review-form__stars">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              className={`review-form__star ${star <= (hoveredRating || rating) ? "review-form__star--filled" : ""}`}
              onMouseEnter={() => setHoveredRating(star)}
              onMouseLeave={() => setHoveredRating(0)}
              onClick={() => setRating(star)}
            >
              ★
            </button>
          ))}
          {rating > 0 && <span className="review-form__rating-text">{rating}/5</span>}
        </div>
      </div>

      <div className="review-form__field">
        <label className="review-form__label">Nhận xét của bạn</label>
        <textarea
          className="review-form__textarea"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Chia sẻ trải nghiệm của bạn với sản phẩm này..."
          maxLength={5000}
          rows={4}
        />
        <span className="review-form__charcount">{content.length}/5000</span>
      </div>

      <div className="review-form__field">
        <label className="review-form__label">Hình ảnh (không bắt buộc, tối đa 3)</label>
        <div style={{ display: "flex", gap: "12px", alignItems: "center", marginTop: "8px", flexWrap: "wrap" }}>
          {/* Uploaded Images Previews */}
          {imageUrls.map((url, i) => (
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
                alt={`Preview ${i + 1}`}
                style={{ width: "100%", height: "100%", objectFit: "cover" }}
              />
              <button
                type="button"
                onClick={() => handleRemoveImage(i)}
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
          {imageUrls.length < 3 && (
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
                cursor: uploadingImage ? "not-allowed" : "pointer",
                gap: "6px",
                color: "#94a3b8",
                userSelect: "none"
              }}
            >
              {uploadingImage ? (
                <>
                  <Loader2 size={20} className="pf-spin" style={{ color: "#10b981" }} />
                  <span style={{ fontSize: "11px", fontWeight: "500" }}>Đang tải...</span>
                </>
              ) : (
                <>
                  <Camera size={20} />
                  <span style={{ fontSize: "11px", fontWeight: "600" }}>
                    {imageUrls.length}/3
                  </span>
                </>
              )}
              <input
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                style={{ display: "none" }}
                disabled={uploadingImage}
              />
            </label>
          )}
        </div>
      </div>

      {error && <p className="review-form__error">{error}</p>}

      <div className="review-form__actions">
        <button className="review-form__cancel" onClick={onCancel}>Hủy</button>
        <button className="review-form__submit" onClick={handleSubmit} disabled={submitting}>
          {submitting ? "Đang gửi..." : "Gửi Đánh Giá"}
        </button>
      </div>
    </div>
  );
}
