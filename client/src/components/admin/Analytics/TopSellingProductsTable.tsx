"use client";

import React from "react";
import { motion } from "framer-motion";
import { Award, Package, TrendingUp } from "lucide-react";
import { TopProduct } from "@/types/admin";

export interface TopSellingProductsTableProps {
  topProducts: TopProduct[];
  formatCurrency: (value: number) => string;
}

export default function TopSellingProductsTable({
  topProducts,
  formatCurrency,
}: TopSellingProductsTableProps) {
  return (
    <div className="analytics-section-card">
      <div className="admin-dashboard__orders-header">
        <div>
          <h3 className="analytics-section-title">
            <Award size={18} className="text-amber-500" />
            Sản phẩm bán chạy nhất trong kỳ
          </h3>
          <p className="analytics-section-subtitle" style={{ margin: 0 }}>
            Bảng xếp hạng sản phẩm có số lượng tiêu thụ tốt nhất trong kỳ báo cáo
          </p>
        </div>
      </div>

      {topProducts.length === 0 ? (
        <div style={{ textAlign: "center", padding: "3rem 1rem", color: "#94a3b8" }}>
          <TrendingUp size={40} style={{ color: "#cbd5e1", marginBottom: "0.5rem" }} />
          <p>Không có sản phẩm bán chạy trong khoảng thời gian này</p>
        </div>
      ) : (
        <div className="admin-dashboard__orders-table-wrap">
          <table className="admin-dashboard__orders-table">
            <thead>
              <tr>
                <th style={{ width: "60px" }}>Xếp hạng</th>
                <th>Sản phẩm</th>
                <th>Phân loại</th>
                <th>Số lượng bán</th>
                <th>Đơn giá</th>
                <th>Tổng doanh thu</th>
              </tr>
            </thead>
            <tbody>
              {topProducts.map((item, index) => {
                const plant = item.product?.[0];
                const rank = index + 1;
                const topQty = topProducts[0]?.totalSold || 1;
                const pct = (item.totalSold / topQty) * 100;

                return (
                  <motion.tr
                    key={item._id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.04 }}
                  >
                    <td>
                      <span
                        className="analytics-medal"
                        style={{
                          background:
                            rank === 1
                              ? "#fef3c7"
                              : rank === 2
                              ? "#e2e8f0"
                              : rank === 3
                              ? "#ffedd5"
                              : "rgba(100, 116, 139, 0.08)",
                          color:
                            rank === 1
                              ? "#b45309"
                              : rank === 2
                              ? "#475569"
                              : rank === 3
                              ? "#c2410c"
                              : "#64748b",
                        }}
                      >
                        {rank}
                      </span>
                    </td>
                    <td>
                      <div className="admin-dashboard__customer-cell">
                        {plant?.imageCover ? (
                          <img
                            src={plant.imageCover}
                            alt={plant?.name}
                            className="admin-dashboard__product-thumb"
                            style={{ width: "42px", height: "42px" }}
                          />
                        ) : (
                          <div
                            className="admin-dashboard__customer-avatar"
                            style={{ width: "42px", height: "42px" }}
                          >
                            <Package size={16} />
                          </div>
                        )}
                        <div>
                          <span
                            className="admin-dashboard__customer-name"
                            style={{ fontSize: "0.9rem" }}
                          >
                            {plant?.name || "Sản phẩm đã bị xóa"}
                          </span>
                          <span className="admin-dashboard__customer-email">
                            ID: #{item._id.slice(-8).toUpperCase()}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className="admin-dashboard__date-cell">
                        {plant?.category || "Chưa phân loại"}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem", width: "120px" }}>
                        <span className="admin-dashboard__amount" style={{ color: "#059669", fontSize: "0.9rem" }}>
                          {item.totalSold} sp
                        </span>
                        <div className="analytics-progress-bar">
                          <div
                            className="analytics-progress-bar__fill"
                            style={{
                              width: `${pct}%`,
                              background: "linear-gradient(135deg, #059669, #10b981)",
                            }}
                          />
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className="admin-dashboard__amount" style={{ fontSize: "0.9rem", fontWeight: 500 }}>
                        {plant ? formatCurrency(plant.price) : "—"}
                      </span>
                    </td>
                    <td>
                      <span className="admin-dashboard__amount" style={{ fontSize: "0.9rem" }}>
                        {formatCurrency(item.revenue)}
                      </span>
                    </td>
                  </motion.tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
