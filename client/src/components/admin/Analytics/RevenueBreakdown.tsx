"use client";

import { DollarSign, ShoppingCart, Package, Users } from "lucide-react";
import { AnalyticsStats } from "@/types/admin";
import React from "react";

export interface RevenueBreakdownProps {
  stats: AnalyticsStats | null;
  formatCurrency: (value: number) => string;
  formatCompactCurrency: (value: number) => string;
  calculateAOV: () => string;
}

export default function RevenueBreakdown({
  stats,
  formatCurrency,
  formatCompactCurrency,
  calculateAOV,
}: RevenueBreakdownProps) {
  return (
    <div className="analytics-breakdown-grid">
      {/* Revenue KPI */}
      <div className="analytics-revenue-card">
        <div
          style={{
            position: "absolute",
            top: "-25px",
            right: "-25px",
            width: "80px",
            height: "80px",
            borderRadius: "50%",
            background: "rgba(16, 185, 129, 0.06)",
            filter: "blur(15px)",
          }}
        />
        <div className="flex items-center justify-between">
          <div>
            <p style={{ fontSize: "0.78rem", color: "#64748b", margin: 0, fontWeight: 600 }}>
              DOANH THU ĐÃ THU
            </p>
            <h3 style={{ fontSize: "1.3rem", fontWeight: 800, color: "#0f172a", margin: "0.35rem 0 0" }} title={formatCurrency(stats?.revenue || 0)}>
              {formatCompactCurrency(stats?.revenue || 0)}
            </h3>
            <p style={{ fontSize: "0.7rem", color: "#94a3b8", margin: "0.15rem 0 0" }}>
              Tổng thu trong khoảng chọn
            </p>
          </div>
          <div style={{ width: "36px", height: "36px", borderRadius: "10px", background: "linear-gradient(135deg, #059669, #10b981)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", flexShrink: 0 }}>
            <DollarSign size={18} />
          </div>
        </div>
      </div>

      {/* Paid Orders KPI */}
      <div className="analytics-revenue-card">
        <div
          style={{
            position: "absolute",
            top: "-25px",
            right: "-25px",
            width: "80px",
            height: "80px",
            borderRadius: "50%",
            background: "rgba(59, 130, 246, 0.06)",
            filter: "blur(15px)",
          }}
        />
        <div className="flex items-center justify-between">
          <div>
            <p style={{ fontSize: "0.78rem", color: "#64748b", margin: 0, fontWeight: 600 }}>
              ĐƠN ĐÃ THANH TOÁN
            </p>
            <h3 style={{ fontSize: "1.3rem", fontWeight: 800, color: "#0f172a", margin: "0.35rem 0 0" }}>
              {stats?.paidOrders || 0} đơn
            </h3>
            <p style={{ fontSize: "0.7rem", color: "#94a3b8", margin: "0.15rem 0 0" }}>
              AOV: {calculateAOV()}
            </p>
          </div>
          <div style={{ width: "36px", height: "36px", borderRadius: "10px", background: "linear-gradient(135deg, #2563eb, #3b82f6)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", flexShrink: 0 }}>
            <ShoppingCart size={18} />
          </div>
        </div>
      </div>

      {/* Total Orders KPI */}
      <div className="analytics-revenue-card">
        <div
          style={{
            position: "absolute",
            top: "-25px",
            right: "-25px",
            width: "80px",
            height: "80px",
            borderRadius: "50%",
            background: "rgba(139, 92, 246, 0.06)",
            filter: "blur(15px)",
          }}
        />
        <div className="flex items-center justify-between">
          <div>
            <p style={{ fontSize: "0.78rem", color: "#64748b", margin: 0, fontWeight: 600 }}>
              TỔNG ĐƠN PHÁT SINH
            </p>
            <h3 style={{ fontSize: "1.3rem", fontWeight: 800, color: "#0f172a", margin: "0.35rem 0 0" }}>
              {stats?.totalOrders || 0} đơn
            </h3>
            <p style={{ fontSize: "0.7rem", color: "#94a3b8", margin: "0.15rem 0 0" }}>
              Tỷ lệ thành công:{" "}
              {stats && stats.totalOrders > 0
                ? ((stats.paidOrders / stats.totalOrders) * 100).toFixed(0)
                : 0}
              %
            </p>
          </div>
          <div style={{ width: "36px", height: "36px", borderRadius: "10px", background: "linear-gradient(135deg, #7c3aed, #8b5cf6)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", flexShrink: 0 }}>
            <Package size={18} />
          </div>
        </div>
      </div>

      {/* New Customers KPI */}
      <div className="analytics-revenue-card">
        <div
          style={{
            position: "absolute",
            top: "-25px",
            right: "-25px",
            width: "80px",
            height: "80px",
            borderRadius: "50%",
            background: "rgba(245, 158, 11, 0.06)",
            filter: "blur(15px)",
          }}
        />
        <div className="flex items-center justify-between">
          <div>
            <p style={{ fontSize: "0.78rem", color: "#64748b", margin: 0, fontWeight: 600 }}>
              KHÁCH HÀNG MỚI
            </p>
            <h3 style={{ fontSize: "1.3rem", fontWeight: 800, color: "#0f172a", margin: "0.35rem 0 0" }}>
              +{stats?.newCustomers || 0}
            </h3>
            <p style={{ fontSize: "0.7rem", color: "#94a3b8", margin: "0.15rem 0 0" }}>
              Đăng ký trong khoảng chọn
            </p>
          </div>
          <div style={{ width: "36px", height: "36px", borderRadius: "10px", background: "linear-gradient(135deg, #d97706, #f59e0b)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", flexShrink: 0 }}>
            <Users size={18} />
          </div>
        </div>
      </div>
    </div>
  );
}
