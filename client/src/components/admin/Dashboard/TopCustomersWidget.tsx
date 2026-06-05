"use client";

import { motion } from "framer-motion";
import { TopCustomer } from "@/types/admin";
import React from "react";

export interface TopCustomersWidgetProps {
  loading: boolean;
  customers: TopCustomer[];
  formatCurrency: (val: number) => string;
}

export default function TopCustomersWidget({
  loading,
  customers,
  formatCurrency,
}: TopCustomersWidgetProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.4 }}
      className="admin-dashboard__widget-card"
    >
      <div className="admin-dashboard__widget-header">
        <div>
          <h3 className="admin-dashboard__widget-title">Top 5 khách hàng chi tiêu cao</h3>
          <p className="admin-dashboard__widget-subtitle">Nhóm đối tác khách hàng mua sắm nhiều nhất</p>
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
        ) : customers.length === 0 ? (
          <div style={{ textAlign: "center", padding: "2rem 0", color: "#94a3b8", fontSize: "0.85rem" }}>
            Chưa có dữ liệu khách hàng
          </div>
        ) : (
          <div className="admin-dashboard__widget-list">
            {customers.map((cust, idx) => {
              const initial = cust.name ? (cust.name.split(" ").pop()?.charAt(0) || "U") : "U";
              return (
                <div key={cust._id || idx} className="admin-dashboard__customer-item">
                  <div className="admin-dashboard__customer-info">
                    {cust.avatar ? (
                      <img
                        src={cust.avatar}
                        alt={cust.name}
                        className="admin-dashboard__customer-avatar-circle"
                        style={{ width: "36px", height: "36px", borderRadius: "50%", objectFit: "cover" }}
                      />
                    ) : (
                      <div className="admin-dashboard__customer-avatar-circle">
                        {initial}
                      </div>
                    )}
                    <div className="admin-dashboard__customer-meta">
                      <span className="admin-dashboard__customer-name-bold">{cust.name}</span>
                      <span className="admin-dashboard__customer-email-sub">{cust.email}</span>
                    </div>
                  </div>
                  <div className="admin-dashboard__customer-spend">
                    <span className="admin-dashboard__customer-amount">{formatCurrency(cust.totalSpent)}</span>
                    <span className="admin-dashboard__customer-orders-count">{cust.orderCount} đơn hàng</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </motion.div>
  );
}
