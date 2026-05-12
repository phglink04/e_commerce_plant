"use client";
import { useEffect, useState } from "react";
import { dashboardService } from "@/services/admin/dashboard.service";
import { RevenueChartData } from "@/types/admin";

export function LineChart() {
  const [data, setData] = useState<RevenueChartData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await dashboardService.getRevenueChart("week");
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

  const maxRevenue = Math.max(...data.map((d) => d.revenue));
  const chartHeight = 200;

  return (
    <div>
      <div className="flex items-end gap-2 h-64 border-b border-l border-slate-200 p-4">
        {data.map((item, idx) => {
          const height = (item.revenue / maxRevenue) * chartHeight || 10;
          return (
            <div key={idx} className="flex-1 flex flex-col items-center gap-2">
              <div
                className="w-full bg-emerald-500 rounded-t hover:bg-emerald-600 transition"
                style={{ height: `${height}px` }}
                title={`$${item.revenue.toLocaleString()}`}
              />
              <span className="text-xs text-slate-500">{item._id}</span>
            </div>
          );
        })}
      </div>
      <div className="text-sm text-slate-600 mt-4">
        Revenue: ${data.reduce((sum, d) => sum + d.revenue, 0).toLocaleString()}
      </div>
    </div>
  );
}
