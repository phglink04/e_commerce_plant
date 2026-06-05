"use client";

import React from "react";
import { Star } from "lucide-react";
import { ReviewStats } from "@/types/admin";

export interface ReviewStatsWidgetProps {
  reviewStats: ReviewStats | null;
}

export default function ReviewStatsWidget({
  reviewStats,
}: ReviewStatsWidgetProps) {
  return (
    <div className="analytics-split-grid-13">
      {/* Review stats breakdown */}
      <div className="analytics-section-card">
        <h3 className="analytics-section-title">Thống kê xếp hạng sao</h3>
        <p className="analytics-section-subtitle">Phân bố đánh giá của khách hàng</p>

        <div style={{ textAlign: "center", marginBottom: "1.25rem" }}>
          <p style={{ fontSize: "3rem", fontWeight: 800, color: "#f59e0b", margin: 0, lineHeight: 1 }}>
            {reviewStats?.avgRating || "0.0"}
          </p>
          <div className="flex justify-center gap-0.5" style={{ margin: "0.35rem 0" }}>
            {[...Array(5)].map((_, i) => {
              const ratingVal = reviewStats?.avgRating || 0;
              return (
                <Star
                  key={i}
                  size={16}
                  fill={i < Math.round(ratingVal) ? "#f59e0b" : "none"}
                  stroke="#f59e0b"
                />
              );
            })}
          </div>
          <p style={{ fontSize: "0.75rem", color: "#94a3b8", margin: 0 }}>
            Dựa trên {reviewStats?.total || 0} đánh giá trong kỳ
          </p>
        </div>

        <div>
          {[5, 4, 3, 2, 1].map((stars) => {
            const count =
              reviewStats?.distribution?.find((d) => d.rating === stars)?.count || 0;
            const total = reviewStats?.total || 1;
            const pct = reviewStats?.total ? (count / total) * 100 : 0;
            return (
              <div key={stars} className="analytics-rating-row">
                <span className="analytics-rating-row__label">{stars} ★</span>
                <div className="analytics-rating-row__bar">
                  <div
                    className="analytics-rating-row__fill"
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <span className="analytics-rating-row__count">{count}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Latest reviews list */}
      <div className="analytics-section-card">
        <h3 className="analytics-section-title">Đánh giá sản phẩm mới nhất</h3>
        <p className="analytics-section-subtitle">
          Các đánh giá gửi bởi khách hàng trong khoảng thời gian đã lọc
        </p>

        <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
          {reviewStats?.recent.length === 0 ? (
            <p style={{ textAlign: "center", color: "#94a3b8", fontSize: "0.85rem", padding: "1.5rem" }}>
              Không có đánh giá nào trong thời gian này
            </p>
          ) : (
            reviewStats?.recent.map((rev) => (
              <div key={rev._id} className="analytics-review-item">
                <div className="flex items-center justify-between" style={{ marginBottom: "0.25rem" }}>
                  <div>
                    <span style={{ fontWeight: 600, fontSize: "0.85rem", color: "#0f172a" }}>
                      {rev.userName}
                    </span>
                    <span style={{ fontSize: "0.72rem", color: "#94a3b8", marginLeft: "0.5rem" }}>
                      sản phẩm:{" "}
                      <strong style={{ color: "#475569" }}>
                        {rev.productName || "Sản phẩm đã bị xóa"}
                      </strong>
                    </span>
                  </div>
                  <div className="flex gap-0.5">
                    {/* Empty block or rating stars moved here if wanted, but keep it empty since stars are below */}
                  </div>
                </div>
                <div className="flex gap-0.5" style={{ marginBottom: "0.25rem" }}>
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      size={12}
                      fill={i < rev.rating ? "#f59e0b" : "none"}
                      stroke="#f59e0b"
                    />
                  ))}
                </div>
                <p style={{ fontSize: "0.82rem", color: "#475569", margin: "0.2rem 0 0", lineHeight: 1.4 }}>
                  "{rev.content}"
                </p>
                <span style={{ fontSize: "0.7rem", color: "#94a3b8", display: "block", marginTop: "0.25rem", textAlign: "right" }}>
                  {new Date(rev.createdAt).toLocaleDateString("vi-VN")}
                </span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
