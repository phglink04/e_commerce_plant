"use client";
import { motion } from "framer-motion";
import { ReactNode } from "react";

interface MiniStatProps {
  label: string;
  value: number | string;
  icon: ReactNode;
  color: string;
  bgColor: string;
  delay?: number;
}

export function MiniStatCard({
  label,
  value,
  icon,
  color,
  bgColor,
  delay = 0,
}: MiniStatProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4, delay: delay * 0.1 }}
      style={{
        background: "#fff",
        borderRadius: "16px",
        padding: "1.15rem 1.25rem",
        border: "1px solid #f1f5f9",
        display: "flex",
        alignItems: "center",
        gap: "1rem",
        cursor: "default",
        transition: "all 0.25s ease",
      }}
      className="admin-mini-stat"
    >
      <div
        style={{
          width: "42px",
          height: "42px",
          borderRadius: "12px",
          background: bgColor,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: color,
          flexShrink: 0,
        }}
      >
        {icon}
      </div>
      <div>
        <p
          style={{
            margin: 0,
            fontSize: "0.78rem",
            color: "#94a3b8",
            fontWeight: 500,
          }}
        >
          {label}
        </p>
        <p
          style={{
            margin: "0.15rem 0 0",
            fontSize: "1.3rem",
            fontWeight: 700,
            color: color,
            lineHeight: 1.2,
          }}
        >
          {value}
        </p>
      </div>
    </motion.div>
  );
}
