"use client";

import React from "react";
import { AnalyticsStats, RecentCustomer } from "@/types/admin";

export interface UserMetricsProps {
  stats: AnalyticsStats | null;
  recentCustomers: RecentCustomer[];
}

export default function UserMetrics({
  stats,
  recentCustomers,
}: UserMetricsProps) {
  return (
    <div className="analytics-split-grid-13">
      {/* User metrics breakdown */}
      <div className="analytics-section-card">
        <h3 className="analytics-section-title">Chỉ số người dùng</h3>
        <p className="analytics-section-subtitle">Đăng ký mới & tương tác</p>

        <div className="analytics-mini-kpi-grid" style={{ marginBottom: "1rem" }}>
          <div className="analytics-mini-kpi">
            <p className="analytics-mini-kpi__value">+{stats?.newCustomers || 0}</p>
            <p className="analytics-mini-kpi__label">Thành viên mới</p>
          </div>
          <div className="analytics-mini-kpi">
            <p className="analytics-mini-kpi__value">
              {stats && stats.totalOrders > 0
                ? ((stats.newCustomers / stats.totalOrders) * 100).toFixed(1)
                : 0}
              %
            </p>
            <p className="analytics-mini-kpi__label">Tỷ lệ KH mới / Đơn</p>
          </div>
        </div>
        <p style={{ fontSize: "0.8rem", color: "#64748b", lineHeight: 1.5, margin: 0 }}>
          Biểu thị số lượng tài khoản mới đăng ký trong thời gian đã chọn và tỷ lệ đăng ký mới so với các giao dịch phát sinh.
        </p>
      </div>

      {/* Recent customers list */}
      <div className="analytics-section-card">
        <h3 className="analytics-section-title">Thành viên đăng ký mới gần đây</h3>
        <p className="analytics-section-subtitle">
          Danh sách khách hàng đăng ký tài khoản trong khoảng thời gian đã lọc
        </p>

        <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
          {recentCustomers.length === 0 ? (
            <p style={{ textAlign: "center", color: "#94a3b8", fontSize: "0.85rem", padding: "1.5rem" }}>
              Không có khách hàng mới đăng ký trong thời gian này
            </p>
          ) : (
            recentCustomers.map((cust) => {
              const initial = cust.name
                ? cust.name.split(" ").pop()?.charAt(0).toUpperCase()
                : "U";
              return (
                <div key={cust._id} className="analytics-customer-item">
                  <div className="analytics-customer-avatar">{initial}</div>
                  <div style={{ flex: 1 }}>
                    <span style={{ fontWeight: 600, fontSize: "0.85rem", color: "#0f172a", display: "block" }}>
                      {cust.name}
                    </span>
                    <span style={{ fontSize: "0.72rem", color: "#94a3b8", display: "block" }}>
                      {cust.email}
                    </span>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <span style={{ fontSize: "0.75rem", color: "#64748b", display: "block", fontWeight: 500 }}>
                      Ngày đăng ký
                    </span>
                    <span style={{ fontSize: "0.72rem", color: "#94a3b8" }}>
                      {new Date(cust.createdAt).toLocaleDateString("vi-VN")}
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
