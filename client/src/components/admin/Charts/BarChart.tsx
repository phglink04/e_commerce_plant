"use client";
import { useEffect, useState } from "react";
import { dashboardService } from "@/services/admin/dashboard.service";
import { OrderStatusChartData } from "@/types/admin";

const statusColors: Record<string, string> = {
  Pending: "bg-yellow-500",
  Processing: "bg-blue-500",
  Delivered: "bg-green-500",
  Cancelled: "bg-red-500",
  completed: "bg-emerald-500",
};

const statusLabels: Record<string, string> = {
  Pending: "Pending",
  Processing: "Processing",
  Delivered: "Delivered",
  Cancelled: "Cancelled",
  completed: "Completed",
};

export function BarChart() {
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
      <div className="h-64 flex items-center justify-center text-slate-500">
        Loading...
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center text-slate-500">
        No data available
      </div>
    );
  }

  const maxCount = Math.max(...data.map((d) => d.count));
  const chartHeight = 200;

  return (
    <div>
      <div className="flex items-end gap-4 h-64 border-b border-l border-slate-200 p-4">
        {data.map((item, idx) => {
          const height = (item.count / maxCount) * chartHeight || 10;
          const status = item._id as string;
          const color = statusColors[status] || "bg-gray-500";

          return (
            <div key={idx} className="flex-1 flex flex-col items-center gap-2">
              <div
                className={`${color} w-full rounded-t hover:opacity-80 transition`}
                style={{ height: `${height}px` }}
                title={`${item.count} orders`}
              />
              <span className="text-xs text-slate-500">
                {statusLabels[status] || status}
              </span>
              <span className="text-xs font-semibold text-slate-700">
                {item.count}
              </span>
            </div>
          );
        })}
      </div>
      <div className="text-sm text-slate-600 mt-4">
        Total Orders: {data.reduce((sum, d) => sum + d.count, 0)}
      </div>
    </div>
  );
}
