"use client";

import { motion } from "framer-motion";
import React from "react";

export interface KPICardProps {
  title: string;
  value: string | number;
  subText?: string;
  trend?: { value: number | string; isUp: boolean; label: string };
  icon: React.ReactNode;
  color: "emerald" | "blue" | "violet" | "amber" | "rose";
  delay?: number;
}

export default function KPICard({
  title,
  value,
  subText,
  trend,
  icon,
  color,
  delay = 0,
}: KPICardProps) {
  const colors = {
    emerald: {
      gradient: "linear-gradient(135deg, #059669, #10b981)",
      bg: "rgba(16, 185, 129, 0.08)",
      border: "rgba(16, 185, 129, 0.12)",
      text: "#059669",
    },
    blue: {
      gradient: "linear-gradient(135deg, #2563eb, #3b82f6)",
      bg: "rgba(59, 130, 246, 0.08)",
      border: "rgba(59, 130, 246, 0.12)",
      text: "#2563eb",
    },
    violet: {
      gradient: "linear-gradient(135deg, #7c3aed, #8b5cf6)",
      bg: "rgba(139, 92, 246, 0.08)",
      border: "rgba(139, 92, 246, 0.12)",
      text: "#7c3aed",
    },
    amber: {
      gradient: "linear-gradient(135deg, #d97706, #f59e0b)",
      bg: "rgba(245, 158, 11, 0.08)",
      border: "rgba(245, 158, 11, 0.12)",
      text: "#d97706",
    },
    rose: {
      gradient: "linear-gradient(135deg, #e11d48, #f43f5e)",
      bg: "rgba(244, 63, 94, 0.08)",
      border: "rgba(244, 63, 94, 0.12)",
      text: "#e11d48",
    },
  };

  const cfg = colors[color];

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: delay * 0.08 }}
      className="admin-stat-card"
      style={{
        background: "#fff",
        borderRadius: "20px",
        padding: "1.25rem",
        border: `1px solid ${cfg.border}`,
        position: "relative",
        overflow: "hidden",
        boxShadow: "0 4px 12px rgba(0, 0, 0, 0.01)",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        minHeight: "155px",
        transition: "transform 0.2s ease, box-shadow 0.2s ease",
      }}
      whileHover={{ y: -2, boxShadow: "0 10px 25px rgba(0, 0, 0, 0.04)" }}
    >
      {/* Subtle background glow */}
      <div
        style={{
          position: "absolute",
          top: "-30px",
          right: "-30px",
          width: "90px",
          height: "90px",
          borderRadius: "50%",
          background: cfg.bg,
          filter: "blur(20px)",
          pointerEvents: "none",
        }}
      />

      {/* Top row: Label & Icon */}
      <div className="flex items-center justify-between relative z-10" style={{ gap: "0.5rem" }}>
        <span style={{ fontSize: "0.82rem", fontWeight: 700, color: "#64748b", whiteSpace: "nowrap" }}>
          {title}
        </span>
        <div
          style={{
            width: "36px",
            height: "36px",
            borderRadius: "10px",
            background: cfg.gradient,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "#fff",
            boxShadow: `0 4px 10px ${cfg.bg.replace("0.08", "0.2")}`,
            flexShrink: 0,
          }}
        >
          {icon}
        </div>
      </div>

      {/* Middle row: Large Value & Today stats */}
      <div className="relative z-10" style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", marginTop: "0.5rem" }}>
        <h2 style={{ fontSize: "1.35rem", fontWeight: 800, color: "#0f172a", margin: "0", letterSpacing: "-0.5px", whiteSpace: "nowrap" }}>
          {value}
        </h2>
        {subText && (
          <div style={{ fontSize: "0.75rem", color: "#475569", fontWeight: 600, marginTop: "0.25rem", whiteSpace: "nowrap" }}>
            {subText}
          </div>
        )}
      </div>

      {/* Bottom row: Trend indicator */}
      {trend && (
        <div className="relative z-10" style={{ marginTop: "0.5rem", borderTop: "1px solid #f8fafc", paddingTop: "0.4rem" }}>
          <div className="flex items-center gap-1 flex-wrap" style={{ fontSize: "0.72rem", fontWeight: 700, color: trend.isUp ? "#059669" : "#ef4444" }}>
            <span>{trend.isUp ? "↑" : "↓"} {trend.value}</span>
            <span style={{ color: "#94a3b8", fontWeight: 500 }}>{trend.label}</span>
          </div>
        </div>
      )}
    </motion.div>
  );
}
