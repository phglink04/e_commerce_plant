"use client";
import { ReactNode, useEffect, useState } from "react";
import { TrendingUp, TrendingDown } from "lucide-react";
import { clamp, motion } from "framer-motion";

interface StatCardProps {
  label: string;
  value: number | string;
  icon: ReactNode;
  trend?: { value: number; direction: "up" | "down" };
  color?: "emerald" | "blue" | "violet" | "amber" | "rose";
  delay?: number;
  subValue?: string;
  tooltip?: string;
}

const colorConfig = {
  emerald: {
    gradient: "linear-gradient(135deg, #059669, #10b981)",
    bg: "rgba(16, 185, 129, 0.08)",
    border: "rgba(16, 185, 129, 0.15)",
    text: "#059669",
    light: "#ecfdf5",
  },
  blue: {
    gradient: "linear-gradient(135deg, #2563eb, #3b82f6)",
    bg: "rgba(59, 130, 246, 0.08)",
    border: "rgba(59, 130, 246, 0.15)",
    text: "#2563eb",
    light: "#eff6ff",
  },
  violet: {
    gradient: "linear-gradient(135deg, #7c3aed, #8b5cf6)",
    bg: "rgba(139, 92, 246, 0.08)",
    border: "rgba(139, 92, 246, 0.15)",
    text: "#7c3aed",
    light: "#f5f3ff",
  },
  amber: {
    gradient: "linear-gradient(135deg, #d97706, #f59e0b)",
    bg: "rgba(245, 158, 11, 0.08)",
    border: "rgba(245, 158, 11, 0.15)",
    text: "#d97706",
    light: "#fffbeb",
  },
  rose: {
    gradient: "linear-gradient(135deg, #e11d48, #f43f5e)",
    bg: "rgba(244, 63, 94, 0.08)",
    border: "rgba(244, 63, 94, 0.15)",
    text: "#e11d48",
    light: "#fff1f2",
  },
};

export function StatCard({
  label,
  value,
  icon,
  trend,
  color = "emerald",
  delay = 0,
  subValue,
  tooltip,
}: StatCardProps) {
  const config = colorConfig[color];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: delay * 0.1 }}
      className="admin-stat-card"
      title={tooltip || String(value)}
      style={{
        background: "#fff",
        borderRadius: "20px",
        padding: "1.5rem",
        border: `1px solid ${config.border}`,
        position: "relative",
        overflow: "hidden",
        cursor: "default",
      }}
    >
      {/* Subtle background glow */}
      <div
        style={{
          position: "absolute",
          top: "-40px",
          right: "-40px",
          width: "120px",
          height: "120px",
          borderRadius: "50%",
          background: config.bg,
          filter: "blur(30px)",
          pointerEvents: "none",
        }}
      />

      <div className="flex items-center justify-between relative z-10">
        <div className="flex-1">
          <p
            style={{
              fontSize: "0.82rem",
              fontWeight: 500,
              color: "#64748b",
              letterSpacing: "0.3px",
              margin: 0,
            }}
          >
            {label}
          </p>
          <p
            className="admin-stat-card__value"
            style={{
              fontWeight: 800,
              color: "#0f172a",
              margin: "0.5rem 0 0",
              letterSpacing: "-0.5px",
              lineHeight: 1.1,
            }}
          >
            {value}
          </p>
          {subValue && (
            <p
              style={{
                fontSize: "0.75rem",
                color: "#64748b",
                fontWeight: 500,
                margin: "0.2rem 0 0",
              }}
            >
              {subValue}
            </p>
          )}
          {trend && (
            <div
              className="flex items-center gap-1"
              style={{
                marginTop: "0.6rem",
                fontSize: "0.8rem",
                fontWeight: 600,
                color: trend.direction === "up" ? "#059669" : "#e11d48",
              }}
            >
              <span
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  width: "20px",
                  height: "20px",
                  borderRadius: "6px",
                  background:
                    trend.direction === "up"
                      ? "rgba(5, 150, 105, 0.1)"
                      : "rgba(225, 29, 72, 0.1)",
                }}
              >
                {trend.direction === "up" ? (
                  <TrendingUp size={12} />
                ) : (
                  <TrendingDown size={12} />
                )}
              </span>
              <span>{trend.value}%</span>
              <span
                style={{
                  color: "#94a3b8",
                  fontWeight: 400,
                  fontSize: "0.75rem",
                }}
              >
                vs last month
              </span>
            </div>
          )}
        </div>

        {/* Icon container with gradient */}
        <div
          style={{
            width: "52px",
            height: "52px",
            borderRadius: "16px",
            background: config.gradient,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "#fff",
            boxShadow: `0 8px 20px ${config.bg.replace("0.08", "0.3")}`,
            flexShrink: 0,
          }}
        >
          {icon}
        </div>
      </div>
    </motion.div>
  );
}
