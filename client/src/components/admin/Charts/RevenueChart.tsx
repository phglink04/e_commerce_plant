"use client";
import { useEffect, useState } from "react";
import { dashboardService } from "@/services/admin/dashboard.service";
import { RevenueChartData } from "@/types/admin";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

type RangeType = "week" | "month" | "year";

export function RevenueChart() {
  const [data, setData] = useState<RevenueChartData[]>([]);
  const [loading, setLoading] = useState(true);
  const [range, setRange] = useState<RangeType>("week");

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const response = await dashboardService.getRevenueChart(range);
        setData(response.data || []);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [range]);

  if (loading) {
    return (
      <div
        style={{
          height: "300px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <div className="admin-chart-loader" />
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div
        style={{
          height: "300px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "#94a3b8",
          fontSize: "0.9rem",
        }}
      >
        Không có dữ liệu
      </div>
    );
  }

  const totalRevenue = data.reduce((sum, d) => sum + d.revenue, 0);

  return (
    <div>
      {/* Header with range toggle */}
      <div
        className="flex items-center justify-between"
        style={{ marginBottom: "1.2rem" }}
      >
        <div>
          <h3
            style={{
              margin: 0,
              fontSize: "1.05rem",
              fontWeight: 700,
              color: "#0f172a",
            }}
          >
            Doanh thu
          </h3>
          <p
            style={{
              margin: "0.2rem 0 0",
              fontSize: "0.82rem",
              color: "#94a3b8",
            }}
          >
            Tổng:{" "}
            <span style={{ color: "#059669", fontWeight: 600 }}>
              {totalRevenue.toLocaleString("vi-VN")}₫
            </span>
          </p>
        </div>
        <div
          style={{
            display: "flex",
            gap: "4px",
            background: "#f1f5f9",
            borderRadius: "10px",
            padding: "3px",
          }}
        >
          {(["week", "month", "year"] as RangeType[]).map((r) => (
            <button
              key={r}
              onClick={() => setRange(r)}
              style={{
                padding: "0.35rem 0.75rem",
                borderRadius: "8px",
                border: "none",
                fontSize: "0.78rem",
                fontWeight: 600,
                cursor: "pointer",
                transition: "all 0.2s",
                background: range === r ? "#fff" : "transparent",
                color: range === r ? "#0f172a" : "#94a3b8",
                boxShadow:
                  range === r ? "0 1px 3px rgba(0,0,0,0.08)" : "none",
              }}
            >
              {r === "week" ? "Tuần" : r === "month" ? "Tháng" : "Năm"}
            </button>
          ))}
        </div>
      </div>

      {/* Chart */}
      <ResponsiveContainer width="100%" height={280}>
        <AreaChart data={data}>
          <defs>
            <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#10b981" stopOpacity={0.3} />
              <stop offset="100%" stopColor="#10b981" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid
            strokeDasharray="3 3"
            stroke="#f1f5f9"
            vertical={false}
          />
          <XAxis
            dataKey="_id"
            axisLine={false}
            tickLine={false}
            tick={{ fontSize: 12, fill: "#94a3b8" }}
            dy={10}
          />
          <YAxis
            axisLine={false}
            tickLine={false}
            tick={{ fontSize: 12, fill: "#94a3b8" }}
            tickFormatter={(v) =>
              v >= 1000000
                ? `${(v / 1000000).toFixed(1)}M`
                : v >= 1000
                  ? `${(v / 1000).toFixed(0)}K`
                  : v.toString()
            }
            dx={-10}
          />
          <Tooltip
            contentStyle={{
              background: "rgba(15, 23, 42, 0.95)",
              border: "none",
              borderRadius: "12px",
              padding: "10px 14px",
              boxShadow: "0 8px 30px rgba(0,0,0,0.2)",
            }}
            labelStyle={{ color: "#94a3b8", fontSize: "0.75rem" }}
            itemStyle={{ color: "#fff", fontSize: "0.85rem", fontWeight: 600 }}
            formatter={(value) => [
              `${(value as number).toLocaleString("vi-VN")}₫`,
              "Doanh thu",
            ]}
          />
          <Area
            type="monotone"
            dataKey="revenue"
            stroke="#10b981"
            strokeWidth={2.5}
            fill="url(#revenueGradient)"
            dot={false}
            activeDot={{
              r: 6,
              fill: "#10b981",
              strokeWidth: 3,
              stroke: "#fff",
            }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
