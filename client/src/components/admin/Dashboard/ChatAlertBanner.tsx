"use client";

import { motion } from "framer-motion";
import { MessageSquare, ArrowUpRight } from "lucide-react";
import Link from "next/link";
import React from "react";

export interface ChatAlertBannerProps {
  pendingChats: number;
}

export default function ChatAlertBanner({ pendingChats }: ChatAlertBannerProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.05 }}
      style={{
        background: "linear-gradient(135deg, #fff5f5, #ffe3e3)",
        border: "1px solid #ffe4e6",
        borderRadius: "20px",
        padding: "1rem 1.5rem",
        marginBottom: "1.5rem",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        flexWrap: "wrap",
        gap: "1rem",
        boxShadow: "0 10px 25px rgba(225, 29, 72, 0.03)",
      }}
    >
      <div className="flex items-center gap-3">
        <div
          style={{
            width: "42px",
            height: "42px",
            borderRadius: "12px",
            background: "linear-gradient(135deg, #e11d48, #f43f5e)",
            color: "#fff",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: "0 4px 12px rgba(225, 29, 72, 0.15)",
          }}
        >
          <MessageSquare size={20} className="animate-pulse" />
        </div>
        <div>
          <h4 style={{ margin: "0", fontSize: "0.9rem", fontWeight: 700, color: "#991b1b" }}>
            Yêu cầu hỗ trợ khách hàng chưa xử lý 💬
          </h4>
          <p style={{ margin: "2px 0 0", fontSize: "0.78rem", color: "#b91c1c", fontWeight: 500 }}>
            Hiện có <strong style={{ fontSize: "0.85rem", fontWeight: 800 }}>{pendingChats} hội thoại</strong> trạng thái <span style={{ background: "rgba(225, 29, 72, 0.08)", padding: "2px 6px", borderRadius: "4px", fontSize: "0.7rem", fontWeight: 700 }}>CHỜ XỬ LÝ (PENDING)</span> đang chờ phản hồi.
          </p>
        </div>
      </div>
      <Link
        href="/admin/chat"
        style={{
          background: "#dc2626",
          color: "#fff",
          fontSize: "0.8rem",
          fontWeight: 700,
          padding: "0.6rem 1.25rem",
          borderRadius: "12px",
          textDecoration: "none",
          display: "inline-flex",
          alignItems: "center",
          gap: "0.4rem",
          boxShadow: "0 4px 12px rgba(220, 38, 38, 0.2)",
          transition: "all 0.2s ease",
        }}
        className="hover:scale-105"
      >
        Xử lý ngay
        <ArrowUpRight size={14} />
      </Link>
    </motion.div>
  );
}
