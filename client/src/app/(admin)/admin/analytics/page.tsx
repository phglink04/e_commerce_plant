"use client";
import { useState, useEffect } from "react";
import { dashboardService } from "@/services/admin/dashboard.service";
import { RevenueChart } from "@/components/admin/Charts/RevenueChart";
import {
  CalendarDays,
  RefreshCw,
  AlertTriangle,
  Download,
} from "lucide-react";
import { motion } from "framer-motion";
import * as XLSX from "xlsx";
import {
  AnalyticsStats,
  ReviewStats,
  RecentCustomer,
  OrderStatusChartData,
  TopProduct,
  LowStockProduct,
} from "@/types/admin";

// Sub-components
import RevenueBreakdown from "@/components/admin/Analytics/RevenueBreakdown";
import OrderStatusDistribution from "@/components/admin/Analytics/OrderStatusDistribution";
import UserMetrics from "@/components/admin/Analytics/UserMetrics";
import ReviewStatsWidget from "@/components/admin/Analytics/ReviewStatsWidget";
import InventoryAlerts from "@/components/admin/Analytics/InventoryAlerts";
import TopSellingProductsTable from "@/components/admin/Analytics/TopSellingProductsTable";

// Helpers for date formatting
const formatDate = (date: Date) => {
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
};

const getPresetDates = (selectedPreset: string) => {
  const now = new Date();
  let start = new Date();

  if (selectedPreset === "today") {
    start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  } else if (selectedPreset === "7d") {
    start.setDate(now.getDate() - 7);
  } else if (selectedPreset === "30d") {
    start.setDate(now.getDate() - 30);
  }

  return {
    start: formatDate(start),
    end: formatDate(now),
  };
};

const statusConfig: Record<
  string,
  { label: string; color: string; bg: string }
> = {
  pending: {
    label: "Chờ xử lý",
    color: "#f59e0b",
    bg: "rgba(245, 158, 11, 0.08)",
  },
  processing: {
    label: "Đang xử lý",
    color: "#3b82f6",
    bg: "rgba(59, 130, 246, 0.08)",
  },
  shipped: {
    label: "Đang giao",
    color: "#8b5cf6",
    bg: "rgba(139, 92, 246, 0.08)",
  },
  delivered: {
    label: "Đã giao",
    color: "#10b981",
    bg: "rgba(16, 185, 129, 0.08)",
  },
  completed: {
    label: "Hoàn thành",
    color: "#059669",
    bg: "rgba(5, 150, 105, 0.08)",
  },
  cancelled: {
    label: "Đã hủy",
    color: "#ef4444",
    bg: "rgba(239, 68, 68, 0.08)",
  },
  Pending: {
    label: "Chờ xử lý",
    color: "#f59e0b",
    bg: "rgba(245, 158, 11, 0.08)",
  },
  Processing: {
    label: "Đang xử lý",
    color: "#3b82f6",
    bg: "rgba(59, 130, 246, 0.08)",
  },
  Delivered: {
    label: "Đã giao",
    color: "#10b981",
    bg: "rgba(16, 185, 129, 0.08)",
  },
  Cancelled: {
    label: "Đã hủy",
    color: "#ef4444",
    bg: "rgba(239, 68, 68, 0.08)",
  },
};

export default function AnalyticsPage() {
  const [preset, setPreset] = useState<string>("30d");
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");

  const [stats, setStats] = useState<AnalyticsStats | null>(null);
  const [orderStatus, setOrderStatus] = useState<OrderStatusChartData[]>([]);
  const [topProducts, setTopProducts] = useState<TopProduct[]>([]);
  const [reviewStats, setReviewStats] = useState<ReviewStats | null>(null);
  const [recentCustomers, setRecentCustomers] = useState<RecentCustomer[]>([]);
  const [lowStock, setLowStock] = useState<LowStockProduct[]>([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);

  // Initialize dates based on preset
  useEffect(() => {
    if (preset !== "custom") {
      const { start, end } = getPresetDates(preset);
      setStartDate(start);
      setEndDate(end);
    }
  }, [preset]);

  // Fetch analytics data when date range changes
  const fetchAnalyticsData = async () => {
    if (!startDate || !endDate) return;
    setLoading(true);
    setError(null);
    try {
      const [
        statsRes,
        orderStatusRes,
        topProductsRes,
        reviewRes,
        customersRes,
        lowStockRes,
      ] = await Promise.all([
        dashboardService.getAnalyticsStats(startDate, endDate),
        dashboardService.getAnalyticsOrderStatus(startDate, endDate),
        dashboardService.getAnalyticsTopProducts(startDate, endDate, 10),
        dashboardService.getReviewStats(startDate, endDate),
        dashboardService.getRecentCustomers(startDate, endDate, 5),
        dashboardService.getLowStockProducts(5),
      ]);

      setStats(statsRes.data);
      setOrderStatus(orderStatusRes.data || []);
      setTopProducts(topProductsRes.data || []);
      setReviewStats(reviewRes.data);
      setRecentCustomers(customersRes.data || []);
      setLowStock(lowStockRes.data || []);
    } catch (err: any) {
      console.error(err);
      setError("Đã xảy ra lỗi khi tải dữ liệu thống kê.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalyticsData();
  }, [startDate, endDate]);

  const handleRefresh = async () => {
    await fetchAnalyticsData();
  };

  const handlePresetChange = (p: string) => {
    setPreset(p);
    if (p !== "custom") {
      const { start, end } = getPresetDates(p);
      setStartDate(start);
      setEndDate(end);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(value);
  };

  const formatCompactCurrency = (value: number) => {
    if (value >= 1e9) {
      return `${(value / 1e9).toLocaleString("vi-VN", { maximumFractionDigits: 2 })} tỷ ₫`;
    }
    if (value >= 1e6) {
      return `${(value / 1e6).toLocaleString("vi-VN", { maximumFractionDigits: 1 })} triệu ₫`;
    }
    return formatCurrency(value);
  };

  const calculateAOV = () => {
    if (!stats || !stats.paidOrders) return "0 ₫";
    return formatCurrency(Math.round(stats.revenue / stats.paidOrders));
  };

  // Enterprise Multi-Sheet Excel Export
  const handleExportExcel = () => {
    if (!stats || !reviewStats) return;
    setExporting(true);

    setTimeout(() => {
      try {
        const workbook = XLSX.utils.book_new();

        // Sheet 1: General Stats
        const generalData = [
          ["BÁO CÁO PHÂN TÍCH KINH DOANH PLANTWORLD"],
          [`Khoảng thời gian: ${startDate} đến ${endDate}`],
          [],
          ["Chỉ số KPI", "Giá trị"],
          ["Doanh thu", stats.revenue],
          ["Đơn hàng đã thanh toán", stats.paidOrders],
          ["Tổng đơn hàng phát sinh", stats.totalOrders],
          ["Khách hàng mới đăng ký", stats.newCustomers],
          [
            "Giá trị đơn hàng trung bình (AOV)",
            stats.paidOrders > 0 ? Math.round(stats.revenue / stats.paidOrders) : 0,
          ],
          [],
          ["Thời gian xuất báo cáo", new Date().toLocaleString("vi-VN")],
        ];
        const generalSheet = XLSX.utils.aoa_to_sheet(generalData);
        XLSX.utils.book_append_sheet(workbook, generalSheet, "Tổng quan doanh thu");

        // Sheet 2: Top Selling Products
        const topProductsData = [
          [
            "Xếp hạng",
            "Mã sản phẩm",
            "Tên cây",
            "Phân loại",
            "Số lượng đã bán",
            "Đơn giá",
            "Tổng doanh thu",
          ],
          ...topProducts.map((item, idx) => {
            const plant = item.product?.[0];
            return [
              idx + 1,
              item._id,
              plant?.name || "Sản phẩm đã xóa",
              plant?.category || "Chưa phân loại",
              item.totalSold,
              plant?.price || 0,
              item.revenue,
            ];
          }),
        ];
        const topProductsSheet = XLSX.utils.aoa_to_sheet(topProductsData);
        XLSX.utils.book_append_sheet(
          workbook,
          topProductsSheet,
          "Top sản phẩm bán chạy"
        );

        // Sheet 3: Order Status Distribution
        const orderStatusData = [
          ["Trạng thái đơn hàng", "Mã trạng thái", "Số lượng đơn"],
          ...orderStatus.map((item) => [
            statusConfig[item._id]?.label || item._id,
            item._id,
            item.count,
          ]),
        ];
        const orderStatusSheet = XLSX.utils.aoa_to_sheet(orderStatusData);
        XLSX.utils.book_append_sheet(workbook, orderStatusSheet, "Phân bố đơn hàng");

        // Sheet 4: Reviews & Ratings Stats
        const reviewsSummary = [
          ["Chỉ số đánh giá", "Giá trị"],
          ["Tổng số đánh giá", reviewStats.total],
          ["Đang chờ duyệt", reviewStats.pending],
          ["Điểm đánh giá trung bình", reviewStats.avgRating],
          [],
          ["Phân bố sao", "Số lượng đánh giá"],
          ...[5, 4, 3, 2, 1].map((star) => {
            const count =
              reviewStats.distribution.find((d) => d.rating === star)?.count || 0;
            return [`${star} sao`, count];
          }),
          [],
          ["Danh sách đánh giá mới nhất"],
          [
            "Tên người dùng",
            "Sản phẩm",
            "Số sao",
            "Nội dung",
            "Trạng thái",
            "Ngày tạo",
          ],
          ...reviewStats.recent.map((r) => [
            r.userName,
            r.productName || "Sản phẩm đã xóa",
            r.rating,
            r.content,
            r.isApproved ? "Đã duyệt" : "Chờ duyệt",
            new Date(r.createdAt).toLocaleDateString("vi-VN"),
          ]),
        ];
        const reviewsSheet = XLSX.utils.aoa_to_sheet(reviewsSummary);
        XLSX.utils.book_append_sheet(workbook, reviewsSheet, "Thống kê đánh giá");

        // Save
        XLSX.writeFile(
          workbook,
          `Bao_cao_kinh_doanh_PlantWorld_${startDate}_to_${endDate}.xlsx`
        );
      } catch (err) {
        console.error("Export failed", err);
      } finally {
        setExporting(false);
      }
    }, 800);
  };

  // PieChart donut variables
  const donutData = orderStatus.map((item) => ({
    name: statusConfig[item._id]?.label || item._id,
    value: item.count,
    color: statusConfig[item._id]?.color || "#64748b",
  }));
  const totalOrders = orderStatus.reduce((sum, item) => sum + item.count, 0);

  return (
    <div className="admin-dashboard">
      {/* ── Page Header ── */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="admin-dashboard__header"
      >
        <div>
          <h1 className="admin-dashboard__title">Thống kê & Phân tích 📈</h1>
          <p className="admin-dashboard__subtitle">
            Phân tích chuyên sâu số liệu kinh doanh, đơn hàng, khách hàng và đánh giá sản phẩm theo thời gian.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleExportExcel}
            disabled={exporting || loading}
            className="admin-dashboard__refresh-btn"
            style={{
              background: "linear-gradient(135deg, #1e293b, #334155)",
              boxShadow: "0 4px 14px rgba(30, 41, 59, 0.25)",
            }}
          >
            <Download size={16} className={exporting ? "animate-bounce" : ""} />
            {exporting ? "Đang xuất file..." : "Xuất báo cáo Excel (.xlsx)"}
          </button>
          <button
            onClick={handleRefresh}
            disabled={loading}
            className="admin-dashboard__refresh-btn"
          >
            <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
            Làm mới số liệu
          </button>
        </div>
      </motion.div>

      {/* ── Time Filter Sticky Bar ── */}
      <div className="analytics-filter-bar">
        <span className="analytics-filter-bar__label">
          <CalendarDays size={16} />
          Khoảng thời gian:
        </span>
        <div className="flex gap-1.5 flex-wrap">
          <button
            onClick={() => handlePresetChange("today")}
            className={`analytics-filter-bar__btn ${
              preset === "today" ? "analytics-filter-bar__btn--active" : ""
            }`}
          >
            Hôm nay
          </button>
          <button
            onClick={() => handlePresetChange("7d")}
            className={`analytics-filter-bar__btn ${
              preset === "7d" ? "analytics-filter-bar__btn--active" : ""
            }`}
          >
            7 ngày qua
          </button>
          <button
            onClick={() => handlePresetChange("30d")}
            className={`analytics-filter-bar__btn ${
              preset === "30d" ? "analytics-filter-bar__btn--active" : ""
            }`}
          >
            30 ngày qua
          </button>
          <button
            onClick={() => handlePresetChange("custom")}
            className={`analytics-filter-bar__btn ${
              preset === "custom" ? "analytics-filter-bar__btn--active" : ""
            }`}
          >
            Tùy chọn
          </button>
        </div>

        {preset === "custom" && (
          <motion.div
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-2 ml-auto flex-wrap"
          >
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="analytics-filter-bar__date"
            />
            <span style={{ fontSize: "0.8rem", color: "#94a3b8" }}>đến</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="analytics-filter-bar__date"
            />
          </motion.div>
        )}
      </div>

      {error && (
        <div className="admin-dashboard__error">
          <AlertTriangle size={16} />
          {error}
        </div>
      )}

      {/* ❶ Section 1: Revenue Breakdown KPIs */}
      <RevenueBreakdown
        stats={stats}
        formatCurrency={formatCurrency}
        formatCompactCurrency={formatCompactCurrency}
        calculateAOV={calculateAOV}
      />

      {/* ❷ Section 2: Revenue Chart */}
      <div className="analytics-chart-full">
        <RevenueChart />
      </div>

      {/* ❸ Section 3: Order Status Distribution (Donut + Summary Grid) */}
      <OrderStatusDistribution orderStatus={orderStatus} />

      {/* ❹ Section 4: Khách hàng (Customers: 1/3 stats + 2/3 lists) */}
      <UserMetrics stats={stats} recentCustomers={recentCustomers} />

      {/* ❺ Section 5: Đánh giá (Reviews: 1/3 stars + 2/3 lists) */}
      <ReviewStatsWidget reviewStats={reviewStats} />

      {/* ❻ Section 6: Cảnh báo tồn kho */}
      <InventoryAlerts lowStock={lowStock} />

      {/* ❼ Section 7: Top Selling Products Table */}
      <TopSellingProductsTable
        topProducts={topProducts}
        formatCurrency={formatCurrency}
      />
    </div>
  );
}
