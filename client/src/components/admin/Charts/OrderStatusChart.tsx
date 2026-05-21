"use client";
import { useEffect, useState } from "react";
import { dashboardService } from "@/services/admin/dashboard.service";
import { OrderStatusChartData } from "@/types/admin";
import {
  BarChart as RechartsBarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";

const statusConfig: Record<
  string,
  { label: string; color: string; bg: string }
> = {
  pending: {
    label: "Chờ xử lý",
    color: "#f59e0b",
    bg: "rgba(245, 158, 11, 0.1)",
  },
  processing: {
    label: "Đang xử lý",
    color: "#3b82f6",
    bg: "rgba(59, 130, 246, 0.1)",
  },
  shipped: {
    label: "Đang giao",
    color: "#8b5cf6",
    bg: "rgba(139, 92, 246, 0.1)",
  },
  delivered: {
    label: "Đã giao",
    color: "#10b981",
    bg: "rgba(16, 185, 129, 0.1)",
  },
  completed: {
    label: "Hoàn thành",
    color: "#059669",
    bg: "rgba(5, 150, 105, 0.1)",
  },
  cancelled: { label: "Đã hủy", color: "#ef4444", bg: "rgba(239, 68, 68, 0.1)" },
  Pending: {
    label: "Chờ xử lý",
    color: "#f59e0b",
    bg: "rgba(245, 158, 11, 0.1)",
  },
  Processing: {
    label: "Đang xử lý",
    color: "#3b82f6",
    bg: "rgba(59, 130, 246, 0.1)",
  },
  Delivered: {
    label: "Đã giao",
    color: "#10b981",
    bg: "rgba(16, 185, 129, 0.1)",
  },
  Cancelled: {
    label: "Đã hủy",
    color: "#ef4444",
    bg: "rgba(239, 68, 68, 0.1)",
  },
};

export function OrderStatusChart() {
  const [data, setData] = useState<OrderStatusChartData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await dashboardService.getOrderStatusChart();
        setData(response.data || []);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

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

  const totalOrders = data.reduce((sum, d) => sum + d.count, 0);

  const chartData = data.map((item) => ({
    ...item,
    name: statusConfig[item._id]?.label || item._id,
    color: statusConfig[item._id]?.color || "#94a3b8",
  }));

  return (
    <div>
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
            Đơn hàng theo trạng thái
          </h3>
          <p
            style={{
              margin: "0.2rem 0 0",
              fontSize: "0.82rem",
              color: "#94a3b8",
            }}
          >
            Tổng:{" "}
            <span style={{ color: "#3b82f6", fontWeight: 600 }}>
              {totalOrders} đơn hàng
            </span>
          </p>
        </div>
      </div>

      {/* Legends */}
      <div
        className="flex flex-wrap gap-3"
        style={{ marginBottom: "1rem" }}
      >
        {chartData.map((item) => (
          <div
            key={item._id}
            className="flex items-center gap-1.5"
            style={{ fontSize: "0.78rem", color: "#64748b" }}
          >
            <span
              style={{
                width: "8px",
                height: "8px",
                borderRadius: "50%",
                background: item.color,
                display: "inline-block",
              }}
            />
            {item.name}
          </div>
        ))}
      </div>

      <ResponsiveContainer width="100%" height={250}>
        <RechartsBarChart data={chartData} barSize={40}>
          <CartesianGrid
            strokeDasharray="3 3"
            stroke="#f1f5f9"
            vertical={false}
          />
          <XAxis
            dataKey="name"
            axisLine={false}
            tickLine={false}
            tick={{ fontSize: 12, fill: "#94a3b8" }}
            dy={10}
          />
          <YAxis
            axisLine={false}
            tickLine={false}
            tick={{ fontSize: 12, fill: "#94a3b8" }}
            dx={-10}
            allowDecimals={false}
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
            formatter={(value) => [`${value} đơn`, ""]}
          />
          <Bar dataKey="count" radius={[8, 8, 0, 0]}>
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Bar>
        </RechartsBarChart>
      </ResponsiveContainer>
    </div>
  );
}
