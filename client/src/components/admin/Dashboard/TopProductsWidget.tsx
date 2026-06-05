"use client";

import { motion } from "framer-motion";
import { Package } from "lucide-react";
import { TopProduct } from "@/types/admin";
import React from "react";

export interface TopProductsWidgetProps {
  loading: boolean;
  products: TopProduct[];
  formatCurrency: (val: number) => string;
}

export default function TopProductsWidget({
  loading,
  products,
  formatCurrency,
}: TopProductsWidgetProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.3 }}
      className="admin-dashboard__widget-card"
    >
      <div className="admin-dashboard__widget-header">
        <div>
          <h3 className="admin-dashboard__widget-title">Top 5 sản phẩm bán chạy</h3>
          <p className="admin-dashboard__widget-subtitle">Sản phẩm có lượng tiêu thụ lớn nhất tuần qua</p>
        </div>
      </div>
      <div className="admin-dashboard__widget-body">
        {loading ? (
          <div style={{ display: "flex", flexDirection: "column", gap: "0.85rem" }}>
            {[...Array(4)].map((_, i) => (
              <div key={i} className="admin-dashboard__skeleton-row" style={{ padding: "0.25rem 0" }}>
                <div className="admin-dashboard__skeleton admin-dashboard__skeleton--avatar" style={{ width: "36px", height: "36px" }} />
                <div style={{ flex: 1 }}>
                  <div className="admin-dashboard__skeleton admin-dashboard__skeleton--line" />
                </div>
              </div>
            ))}
          </div>
        ) : products.length === 0 ? (
          <div style={{ textAlign: "center", padding: "2rem 0", color: "#94a3b8", fontSize: "0.85rem" }}>
            Chưa có sản phẩm bán chạy
          </div>
        ) : (
          <div className="admin-dashboard__widget-list">
            {products.slice(0, 5).map((item) => {
              const plant = item.product?.[0];
              return (
                <div key={item._id} className="admin-dashboard__prod-item">
                  <div className="admin-dashboard__prod-info">
                    {plant?.imageCover ? (
                      <img
                        src={plant.imageCover}
                        alt={plant.name}
                        className="admin-dashboard__prod-img"
                      />
                    ) : (
                      <div
                        className="admin-dashboard__prod-img"
                        style={{ background: "#f1f5f9", display: "flex", alignItems: "center", justifyContent: "center" }}
                      >
                        <Package size={14} className="text-slate-400" />
                      </div>
                    )}
                    <div className="admin-dashboard__prod-meta">
                      <span className="admin-dashboard__prod-name">{plant?.name || "Sản phẩm đã xóa"}</span>
                      <span className="admin-dashboard__prod-sold">Đã bán: {item.totalSold} chậu</span>
                    </div>
                  </div>
                  <span className="admin-dashboard__prod-revenue">{formatCurrency(item.revenue)}</span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </motion.div>
  );
}
