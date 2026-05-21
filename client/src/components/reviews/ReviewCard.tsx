"use client";

import { useState } from "react";
import Image, { type ImageLoaderProps } from "next/image";
import type { Review } from "@/types/review";

const passthroughLoader = ({ src }: ImageLoaderProps) => src;

interface Props {
  review: Review;
  currentUserId?: string;
  onLike: (id: string) => void;
  onReply: (id: string, content: string) => void;
  isLoggedIn: boolean;
}

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Vừa xong";
  if (mins < 60) return `${mins} phút trước`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs} giờ trước`;
  const days = Math.floor(hrs / 24);
  if (days < 30) return `${days} ngày trước`;
  return new Date(dateStr).toLocaleDateString();
}

export default function ReviewCard({ review, currentUserId, onLike, onReply, isLoggedIn }: Props) {
  const [showReplies, setShowReplies] = useState(false);
  const [replyText, setReplyText] = useState("");
  const [showReplyForm, setShowReplyForm] = useState(false);
  const [lightboxImg, setLightboxImg] = useState<string | null>(null);

  const isLiked = currentUserId ? review.likedBy.includes(currentUserId) : false;

  const handleSubmitReply = () => {
    if (!replyText.trim()) return;
    onReply(review.id, replyText.trim());
    setReplyText("");
    setShowReplyForm(false);
    setShowReplies(true);
  };

  return (
    <div className="review-card">
      <div className="review-card__header">
        <div className="review-card__avatar">
          {review.userAvatar ? (
            <Image src={review.userAvatar} alt={review.userName} width={40} height={40} loader={passthroughLoader} className="review-card__avatar-img" />
          ) : (
            <div className="review-card__avatar-placeholder">
              {review.userName.charAt(0).toUpperCase()}
            </div>
          )}
        </div>
        <div className="review-card__meta">
          <div className="review-card__name-row">
            <span className="review-card__name">{review.userName}</span>
          </div>
          <div className="review-card__stars">
            {[1, 2, 3, 4, 5].map((s) => (
              <span key={s} className={`review-card__star ${s <= review.rating ? "review-card__star--filled" : ""}`}>★</span>
            ))}
            <span className="review-card__date">{timeAgo(review.createdAt)}</span>
          </div>
        </div>
      </div>

      {review.content && (
        <p className="review-card__content">{review.content}</p>
      )}

      {review.images.length > 0 && (
        <div className="review-card__images">
          {review.images.map((img, i) => (
            <button key={i} className="review-card__image-btn" onClick={() => setLightboxImg(img)}>
              <Image src={img} alt={`Review image ${i + 1}`} width={80} height={80} loader={passthroughLoader} className="review-card__image" />
            </button>
          ))}
        </div>
      )}

      <div className="review-card__actions">
        <button
          className={`review-card__like-btn ${isLiked ? "review-card__like-btn--active" : ""}`}
          onClick={() => isLoggedIn && onLike(review.id)}
          disabled={!isLoggedIn}
        >
          {isLiked ? "❤️" : "🤍"} {review.likes > 0 && review.likes}
        </button>
        {isLoggedIn && (
          <button className="review-card__reply-btn" onClick={() => setShowReplyForm(!showReplyForm)}>
            💬 Trả lời
          </button>
        )}
        {review.replies.length > 0 && (
          <button className="review-card__show-replies" onClick={() => setShowReplies(!showReplies)}>
            {showReplies ? "Ẩn" : "Xem"} {review.replies.length} trả lời
          </button>
        )}
      </div>

      {showReplyForm && (
        <div className="review-card__reply-form">
          <textarea
            value={replyText}
            onChange={(e) => setReplyText(e.target.value)}
            placeholder="Viết trả lời..."
            maxLength={2000}
            className="review-card__reply-textarea"
          />
          <div className="review-card__reply-actions">
            <button className="review-card__reply-cancel" onClick={() => setShowReplyForm(false)}>Hủy</button>
            <button className="review-card__reply-submit" onClick={handleSubmitReply} disabled={!replyText.trim()}>Trả lời</button>
          </div>
        </div>
      )}

      {showReplies && review.replies.length > 0 && (
        <div className="review-card__replies">
          {review.replies.map((reply, i) => (
            <div key={i} className={`review-card__reply ${reply.isAdmin ? "review-card__reply--admin" : ""}`}>
              <div className="review-card__reply-header">
                <span className="review-card__reply-name">{reply.userName}</span>
                {reply.isAdmin && <span className="review-card__reply-badge">Quản trị</span>}
                <span className="review-card__reply-date">{timeAgo(reply.createdAt)}</span>
              </div>
              <p className="review-card__reply-content">{reply.content}</p>
            </div>
          ))}
        </div>
      )}

      {lightboxImg && (
        <div className="review-lightbox" onClick={() => setLightboxImg(null)}>
          <div className="review-lightbox__content" onClick={(e) => e.stopPropagation()}>
            <button className="review-lightbox__close" onClick={() => setLightboxImg(null)}>✕</button>
            <Image src={lightboxImg} alt="Review image" width={800} height={600} loader={passthroughLoader} className="review-lightbox__img" />
          </div>
        </div>
      )}
    </div>
  );
}
