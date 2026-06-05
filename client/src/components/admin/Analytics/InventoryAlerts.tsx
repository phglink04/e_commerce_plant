"use client";

import React from "react";
import { AlertTriangle, Package, ArrowUpRight } from "lucide-react";
import Link from "next/link";
import { LowStockProduct } from "@/types/admin";

export interface InventoryAlertsProps {
  lowStock: LowStockProduct[];
}

export default function InventoryAlerts({
  lowStock,
}: InventoryAlertsProps) {
  return (
    <div className="analytics-section-card">
      <div className="flex items-center justify-between" style={{ marginBottom: "1rem" }}>
        <div>
          <h3 className="analytics-section-title">
            <AlertTriangle size={18} className="text-rose-500 animate-pulse" />
            Cảnh báo tồn kho (Sản phẩm sắp hết)
          </h3>
          <p className="analytics-section-subtitle" style={{ margin: 0 }}>
            Danh sách sản phẩm cảnh báo tồn kho mức thấp (Tồn kho &le; 5)
          </p>
        </div>
        <Link
          href="/admin/plants"
          className="admin-dashboard__view-all-btn"
          style={{ fontSize: "0.75rem" }}
        >
          Quản lý kho
        </Link>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: "0.5rem" }}>
        {lowStock.length === 0 ? (
          <p style={{ textAlign: "center", color: "#059669", fontWeight: 600, fontSize: "0.85rem", padding: "1.5rem" }}>
            Không có sản phẩm nào sắp hết hàng! Kho hàng an toàn.
          </p>
        ) : (
          lowStock.map((plant) => {
            const isCritical = plant.stock === 0;
            return (
              <div
                key={plant._id}
                className={`analytics-stock-alert ${
                  isCritical
                    ? "analytics-stock-alert--critical"
                    : "analytics-stock-alert--warning"
                }`}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                  {plant.imageCover ? (
                    <img
                      src={plant.imageCover}
                      alt={plant.name}
                      style={{
                        width: "38px",
                        height: "38px",
                        objectFit: "cover",
                        borderRadius: "8px",
                      }}
                    />
                  ) : (
                    <div
                      style={{
                        width: "38px",
                        height: "38px",
                        borderRadius: "8px",
                        background: "#e2e8f0",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <Package size={16} className="text-slate-400" />
                    </div>
                  )}
                  <div>
                    <span
                      style={{
                        fontWeight: 600,
                        fontSize: "0.85rem",
                        color: isCritical ? "#991b1b" : "#92400e",
                        display: "block",
                      }}
                    >
                      {plant.name}
                    </span>
                    <span style={{ fontSize: "0.72rem", color: isCritical ? "#ef4444" : "#b45309" }}>
                      Danh mục: {plant.category}
                    </span>
                  </div>
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                  <span
                    className="analytics-medal"
                    style={{
                      background: isCritical ? "#fee2e2" : "#fef3c7",
                      color: isCritical ? "#dc2626" : "#d97706",
                      width: "auto",
                      padding: "0.2rem 0.6rem",
                      borderRadius: "20px",
                    }}
                  >
                    Tồn kho: {plant.stock}
                  </span>
                  <Link
                    href={`/admin/plants?search=${encodeURIComponent(plant.name)}`}
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      justifyContent: "center",
                      width: "32px",
                      height: "32px",
                      borderRadius: "8px",
                      background: isCritical ? "#fee2e2" : "#fef3c7",
                      color: isCritical ? "#dc2626" : "#d97706",
                    }}
                  >
                    <ArrowUpRight size={16} />
                  </Link>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
