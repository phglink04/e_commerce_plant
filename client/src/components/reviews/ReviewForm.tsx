"use client";

import { useState } from "react";
import { reviewService } from "@/services/review.service";

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
  const [newUrl, setNewUrl] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const handleAddImage = () => {
    const url = newUrl.trim();
    if (!url) return;
    if (imageUrls.length >= 5) { setError("Tối đa 5 hình ảnh"); return; }
    setImageUrls([...imageUrls, url]);
    setNewUrl("");
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
        <label className="review-form__label">Hình ảnh (không bắt buộc, tối đa 5)</label>
        <div className="review-form__image-input">
          <input
            type="text"
            value={newUrl}
            onChange={(e) => setNewUrl(e.target.value)}
            placeholder="Dán đường dẫn hình ảnh..."
            className="review-form__url-input"
            onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), handleAddImage())}
          />
          <button type="button" className="review-form__add-img-btn" onClick={handleAddImage} disabled={imageUrls.length >= 5}>
            Thêm
          </button>
        </div>
        {imageUrls.length > 0 && (
          <div className="review-form__image-list">
            {imageUrls.map((url, i) => (
              <div key={i} className="review-form__image-item">
                <img src={url} alt={`Preview ${i + 1}`} className="review-form__image-preview" />
                <button type="button" className="review-form__image-remove" onClick={() => handleRemoveImage(i)}>✕</button>
              </div>
            ))}
          </div>
        )}
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
