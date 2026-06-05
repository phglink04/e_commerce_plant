"use client";

import { motion } from "framer-motion";
import { AlertTriangle, Package, CheckCircle } from "lucide-react";
import { LowStockProduct } from "@/types/admin";
import Link from "next/link";
import React from "react";

export interface LowStockWidgetProps {
  loading: boolean;
  products: LowStockProduct[];
}

export default function LowStockWidget({
  loading,
  products,
}: LowStockWidgetProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.5 }}
      className="admin-dashboard__widget-card"
    >
      <div className="admin-dashboard__widget-header">
        <div>
          <h3 className="admin-dashboard__widget-title">
            <AlertTriangle size={16} className="text-rose-500 animate-pulse" />
            Cảnh báo tồn kho
          </h3>
          <p className="admin-dashboard__widget-subtitle">Danh sách sản phẩm sắp hết hàng cần nhập bổ sung</p>
        </div>
        <Link href="/admin/plants" className="admin-dashboard__view-all-btn" style={{ fontSize: "0.72rem" }}>
          Nhập hàng
        </Link>
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
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "2.5rem 0", textAlign: "center" }}>
            <CheckCircle size={32} className="text-emerald-500" style={{ marginBottom: "0.5rem" }} />
            <p style={{ fontSize: "0.85rem", fontWeight: 600, color: "#475569" }}>Tất cả sản phẩm đều đủ hàng 🎉</p>
            <p style={{ fontSize: "0.72rem", color: "#94a3b8" }}>Không có mặt hàng nào có mức tồn kho dưới 5.</p>
          </div>
        ) : (
          <div className="admin-dashboard__widget-list" style={{ gap: "0.7rem" }}>
            {products.map((plant) => (
              <div key={plant._id} className="admin-dashboard__alert-item">
                <div className="admin-dashboard__alert-info">
                  {plant.imageCover ? (
                    <img
                      src={plant.imageCover}
                      alt={plant.name}
                      className="admin-dashboard__prod-img"
                      style={{ width: "34px", height: "34px", borderRadius: "6px" }}
                    />
                  ) : (
                    <div
                      className="admin-dashboard__prod-img"
                      style={{ width: "34px", height: "34px", borderRadius: "6px", background: "#fee2e2", display: "flex", alignItems: "center", justifyContent: "center" }}
                    >
                      <Package size={14} className="text-rose-400" />
                    </div>
                  )}
                  <div className="admin-dashboard__alert-meta">
                    <span className="admin-dashboard__alert-name" style={{ maxWidth: "125px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                      {plant.name}
                    </span>
                    <span className="admin-dashboard__alert-stock">Danh mục: {plant.category}</span>
                  </div>
                </div>
                <span className="admin-dashboard__alert-badge">Tồn: {plant.stock}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
}
