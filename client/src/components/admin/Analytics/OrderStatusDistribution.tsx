"use client";

import React from "react";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
} from "recharts";
import { OrderStatusChartData } from "@/types/admin";

export interface OrderStatusDistributionProps {
  orderStatus: OrderStatusChartData[];
}

const statusConfig: Record<
  string,
  { label: string; color: string; bg: string }
> = {
  pending: {
    label: "Chờ xử lý",
    color: "#f59e0b",
    bg: "rgba(245, 158, 11, 0.08)",
  },
  processing: {
    label: "Đang xử lý",
    color: "#3b82f6",
    bg: "rgba(59, 130, 246, 0.08)",
  },
  shipped: {
    label: "Đang giao",
    color: "#8b5cf6",
    bg: "rgba(139, 92, 246, 0.08)",
  },
  delivered: {
    label: "Đã giao",
    color: "#10b981",
    bg: "rgba(16, 185, 129, 0.08)",
  },
  completed: {
    label: "Hoàn thành",
    color: "#059669",
    bg: "rgba(5, 150, 105, 0.08)",
  },
  cancelled: {
    label: "Đã hủy",
    color: "#ef4444",
    bg: "rgba(239, 68, 68, 0.08)",
  },
  Pending: {
    label: "Chờ xử lý",
    color: "#f59e0b",
    bg: "rgba(245, 158, 11, 0.08)",
  },
  Processing: {
    label: "Đang xử lý",
    color: "#3b82f6",
    bg: "rgba(59, 130, 246, 0.08)",
  },
  Delivered: {
    label: "Đã giao",
    color: "#10b981",
    bg: "rgba(16, 185, 129, 0.08)",
  },
  Cancelled: {
    label: "Đã hủy",
    color: "#ef4444",
    bg: "rgba(239, 68, 68, 0.08)",
  },
};

export default function OrderStatusDistribution({
  orderStatus,
}: OrderStatusDistributionProps) {
  // PieChart donut variables
  const donutData = orderStatus.map((item) => ({
    name: statusConfig[item._id]?.label || item._id,
    value: item.count,
    color: statusConfig[item._id]?.color || "#64748b",
  }));
  const totalOrders = orderStatus.reduce((sum, item) => sum + item.count, 0);

  return (
    <div className="analytics-split-grid">
      <div className="analytics-section-card" style={{ position: "relative" }}>
        <h3 className="analytics-section-title">Phân bố trạng thái đơn hàng</h3>
        <p className="analytics-section-subtitle">
          Trực quan hóa tỷ lệ phần trăm các trạng thái đơn hàng
        </p>

        <div style={{ position: "relative", height: "250px" }}>
          {orderStatus.length === 0 ? (
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", color: "#94a3b8" }}>
              Không có dữ liệu đơn hàng
            </div>
          ) : (
            <>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={donutData}
                    cx="50%"
                    cy="50%"
                    innerRadius={65}
                    outerRadius={85}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {donutData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <RechartsTooltip
                    contentStyle={{
                      background: "rgba(15, 23, 42, 0.95)",
                      border: "none",
                      borderRadius: "12px",
                      padding: "8px 12px",
                      boxShadow: "0 8px 30px rgba(0,0,0,0.2)",
                    }}
                    itemStyle={{ color: "#fff", fontSize: "0.82rem", fontWeight: 600 }}
                    formatter={(value) => [`${value} đơn`, ""]}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div
                style={{
                  position: "absolute",
                  top: "50%",
                  left: "50%",
                  transform: "translate(-50%, -50%)",
                  textAlign: "center",
                  pointerEvents: "none",
                }}
              >
                <span style={{ fontSize: "1.6rem", fontWeight: 800, color: "#0f172a", display: "block", lineHeight: 1 }}>
                  {totalOrders}
                </span>
                <span style={{ fontSize: "0.72rem", color: "#94a3b8", fontWeight: 600 }}>
                  Đơn hàng
                </span>
              </div>
            </>
          )}
        </div>
      </div>

      <div className="analytics-section-card">
        <h3 className="analytics-section-title font-bold text-slate-800">Thống kê chi tiết đơn</h3>
        <p className="analytics-section-subtitle">
          Số lượng đơn hàng chi tiết được phân theo từng trạng thái vận hành
        </p>

        <div className="analytics-order-summary-grid">
          {orderStatus.length === 0 ? (
            <div style={{ gridColumn: "span 2", textAlign: "center", padding: "3rem 1rem", color: "#94a3b8" }}>
              Chưa phát sinh đơn hàng
            </div>
          ) : (
            orderStatus.map((item) => {
              const config = statusConfig[item._id] || {
                label: item._id,
                color: "#64748b",
                bg: "rgba(100, 116, 139, 0.08)",
              };
              return (
                <div
                  key={item._id}
                  className="analytics-order-summary-card"
                  style={{
                    background: config.bg,
                    border: `1px solid ${config.color}15`,
                  }}
                >
                  <p
                    className="analytics-order-summary-card__count"
                    style={{ color: config.color }}
                  >
                    {item.count}
                  </p>
                  <p
                    className="analytics-order-summary-card__label"
                    style={{ color: "#475569" }}
                  >
                    {config.label}
                  </p>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
