"use client";
import { useState, useEffect } from "react";
import { dashboardService } from "@/services/admin/dashboard.service";
import { RevenueChart } from "@/components/admin/Charts/RevenueChart";
import {
  CalendarDays,
  RefreshCw,
  AlertTriangle,
  Download,
  Award,
  DollarSign,
  ShoppingCart,
  Users,
  Package,
  Star,
  ArrowUpRight,
  TrendingUp,
  FileSpreadsheet,
} from "lucide-react";
import { motion } from "framer-motion";
import Link from "next/link";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
} from "recharts";
import * as XLSX from "xlsx";
import {
  AnalyticsStats,
  ReviewStats,
  RecentCustomer,
  OrderStatusChartData,
  TopProduct,
  LowStockProduct,
} from "@/types/admin";

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
      <div className="analytics-breakdown-grid">
        <div className="analytics-revenue-card">
          <div
            style={{
              position: "absolute",
              top: "-25px",
              right: "-25px",
              width: "80px",
              height: "80px",
              borderRadius: "50%",
              background: "rgba(16, 185, 129, 0.06)",
              filter: "blur(15px)",
            }}
          />
          <div className="flex items-center justify-between">
            <div>
              <p style={{ fontSize: "0.78rem", color: "#64748b", margin: 0, fontWeight: 600 }}>
                DOANH THU ĐÃ THU
              </p>
              <h3 style={{ fontSize: "1.3rem", fontWeight: 800, color: "#0f172a", margin: "0.35rem 0 0" }} title={formatCurrency(stats?.revenue || 0)}>
                {formatCompactCurrency(stats?.revenue || 0)}
              </h3>
              <p style={{ fontSize: "0.7rem", color: "#94a3b8", margin: "0.15rem 0 0" }}>
                Tổng thu trong khoảng chọn
              </p>
            </div>
            <div style={{ width: "36px", height: "36px", borderRadius: "10px", background: "linear-gradient(135deg, #059669, #10b981)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff" }}>
              <DollarSign size={18} />
            </div>
          </div>
        </div>

        <div className="analytics-revenue-card">
          <div
            style={{
              position: "absolute",
              top: "-25px",
              right: "-25px",
              width: "80px",
              height: "80px",
              borderRadius: "50%",
              background: "rgba(59, 130, 246, 0.06)",
              filter: "blur(15px)",
            }}
          />
          <div className="flex items-center justify-between">
            <div>
              <p style={{ fontSize: "0.78rem", color: "#64748b", margin: 0, fontWeight: 600 }}>
                ĐƠN ĐÃ THANH TOÁN
              </p>
              <h3 style={{ fontSize: "1.3rem", fontWeight: 800, color: "#0f172a", margin: "0.35rem 0 0" }}>
                {stats?.paidOrders || 0} đơn
              </h3>
              <p style={{ fontSize: "0.7rem", color: "#94a3b8", margin: "0.15rem 0 0" }}>
                AOV: {calculateAOV()}
              </p>
            </div>
            <div style={{ width: "36px", height: "36px", borderRadius: "10px", background: "linear-gradient(135deg, #2563eb, #3b82f6)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff" }}>
              <ShoppingCart size={18} />
            </div>
          </div>
        </div>

        <div className="analytics-revenue-card">
          <div
            style={{
              position: "absolute",
              top: "-25px",
              right: "-25px",
              width: "80px",
              height: "80px",
              borderRadius: "50%",
              background: "rgba(139, 92, 246, 0.06)",
              filter: "blur(15px)",
            }}
          />
          <div className="flex items-center justify-between">
            <div>
              <p style={{ fontSize: "0.78rem", color: "#64748b", margin: 0, fontWeight: 600 }}>
                TỔNG ĐƠN PHÁT SINH
              </p>
              <h3 style={{ fontSize: "1.3rem", fontWeight: 800, color: "#0f172a", margin: "0.35rem 0 0" }}>
                {stats?.totalOrders || 0} đơn
              </h3>
              <p style={{ fontSize: "0.7rem", color: "#94a3b8", margin: "0.15rem 0 0" }}>
                Tỷ lệ thành công:{" "}
                {stats && stats.totalOrders > 0
                  ? ((stats.paidOrders / stats.totalOrders) * 100).toFixed(0)
                  : 0}
                %
              </p>
            </div>
            <div style={{ width: "36px", height: "36px", borderRadius: "10px", background: "linear-gradient(135deg, #7c3aed, #8b5cf6)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff" }}>
              <Package size={18} />
            </div>
          </div>
        </div>

        <div className="analytics-revenue-card">
          <div
            style={{
              position: "absolute",
              top: "-25px",
              right: "-25px",
              width: "80px",
              height: "80px",
              borderRadius: "50%",
              background: "rgba(245, 158, 11, 0.06)",
              filter: "blur(15px)",
            }}
          />
          <div className="flex items-center justify-between">
            <div>
              <p style={{ fontSize: "0.78rem", color: "#64748b", margin: 0, fontWeight: 600 }}>
                KHÁCH HÀNG MỚI
              </p>
              <h3 style={{ fontSize: "1.3rem", fontWeight: 800, color: "#0f172a", margin: "0.35rem 0 0" }}>
                +{stats?.newCustomers || 0}
              </h3>
              <p style={{ fontSize: "0.7rem", color: "#94a3b8", margin: "0.15rem 0 0" }}>
                Đăng ký trong khoảng chọn
              </p>
            </div>
            <div style={{ width: "36px", height: "36px", borderRadius: "10px", background: "linear-gradient(135deg, #d97706, #f59e0b)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff" }}>
              <Users size={18} />
            </div>
          </div>
        </div>
      </div>

      {/* ❷ Section 2: Revenue Chart */}
      <div className="analytics-chart-full">
        <RevenueChart />
      </div>

      {/* ❸ Section 3: Order Status Distribution (Donut + Summary Grid) */}
      <div className="analytics-split-grid">
        <div className="analytics-section-card" style={{ position: "relative" }}>
          <h3 className="analytics-section-title">Phân bố trạng thái đơn hàng</h3>
          <p className="analytics-section-subtitle">
            Trực quan hóa tỷ lệ phần trăm các trạng thái đơn hàng
          </p>

          <div style={{ position: "relative", height: "250px" }}>
            {orderStatus.length === 0 ? (
              <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", color: "#94a3b8" }}>
                Không có dữ liệu đơn hàng
              </div>
            ) : (
              <>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={donutData}
                      cx="50%"
                      cy="50%"
                      innerRadius={65}
                      outerRadius={85}
                      paddingAngle={3}
                      dataKey="value"
                    >
                      {donutData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <RechartsTooltip
                      contentStyle={{
                        background: "rgba(15, 23, 42, 0.95)",
                        border: "none",
                        borderRadius: "12px",
                        padding: "8px 12px",
                        boxShadow: "0 8px 30px rgba(0,0,0,0.2)",
                      }}
                      itemStyle={{ color: "#fff", fontSize: "0.82rem", fontWeight: 600 }}
                      formatter={(value) => [`${value} đơn`, ""]}
                    />
                  </PieChart>
                </ResponsiveContainer>
                <div
                  style={{
                    position: "absolute",
                    top: "50%",
                    left: "50%",
                    transform: "translate(-50%, -50%)",
                    textAlign: "center",
                    pointerEvents: "none",
                  }}
                >
                  <span style={{ fontSize: "1.6rem", fontWeight: 800, color: "#0f172a", display: "block", lineHeight: 1 }}>
                    {totalOrders}
                  </span>
                  <span style={{ fontSize: "0.72rem", color: "#94a3b8", fontWeight: 600 }}>
                    Đơn hàng
                  </span>
                </div>
              </>
            )}
          </div>
        </div>

        <div className="analytics-section-card">
          <h3 className="analytics-section-title font-bold text-slate-800">Thống kê chi tiết đơn</h3>
          <p className="analytics-section-subtitle">
            Số lượng đơn hàng chi tiết được phân theo từng trạng thái vận hành
          </p>

          <div className="analytics-order-summary-grid">
            {orderStatus.length === 0 ? (
              <div style={{ gridColumn: "span 2", textAlign: "center", padding: "3rem 1rem", color: "#94a3b8" }}>
                Chưa phát sinh đơn hàng
              </div>
            ) : (
              orderStatus.map((item) => {
                const config = statusConfig[item._id] || {
                  label: item._id,
                  color: "#64748b",
                  bg: "rgba(100, 116, 139, 0.08)",
                };
                return (
                  <div
                    key={item._id}
                    className="analytics-order-summary-card"
                    style={{
                      background: config.bg,
                      border: `1px solid ${config.color}15`,
                    }}
                  >
                    <p
                      className="analytics-order-summary-card__count"
                      style={{ color: config.color }}
                    >
                      {item.count}
                    </p>
                    <p
                      className="analytics-order-summary-card__label"
                      style={{ color: "#475569" }}
                    >
                      {config.label}
                    </p>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* ❹ Section 4: Khách hàng (Customers: 1/3 stats + 2/3 lists) */}
      <div className="analytics-split-grid-13">
        <div className="analytics-section-card">
          <h3 className="analytics-section-title">Chỉ số người dùng</h3>
          <p className="analytics-section-subtitle">Đăng ký mới & tương tác</p>

          <div className="analytics-mini-kpi-grid" style={{ marginBottom: "1rem" }}>
            <div className="analytics-mini-kpi">
              <p className="analytics-mini-kpi__value">+{stats?.newCustomers || 0}</p>
              <p className="analytics-mini-kpi__label">Thành viên mới</p>
            </div>
            <div className="analytics-mini-kpi">
              <p className="analytics-mini-kpi__value">
                {stats && stats.totalOrders > 0
                  ? ((stats.newCustomers / stats.totalOrders) * 100).toFixed(1)
                  : 0}
                %
              </p>
              <p className="analytics-mini-kpi__label">Tỷ lệ KH mới / Đơn</p>
            </div>
          </div>
          <p style={{ fontSize: "0.8rem", color: "#64748b", lineHeight: 1.5, margin: 0 }}>
            Biểu thị số lượng tài khoản mới đăng ký trong thời gian đã chọn và tỷ lệ đăng ký mới so với các giao dịch phát sinh.
          </p>
        </div>

        <div className="analytics-section-card">
          <h3 className="analytics-section-title">Thành viên đăng ký mới gần đây</h3>
          <p className="analytics-section-subtitle">
            Danh sách khách hàng đăng ký tài khoản trong khoảng thời gian đã lọc
          </p>

          <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
            {recentCustomers.length === 0 ? (
              <p style={{ textAlign: "center", color: "#94a3b8", fontSize: "0.85rem", padding: "1.5rem" }}>
                Không có khách hàng mới đăng ký trong thời gian này
              </p>
            ) : (
              recentCustomers.map((cust) => {
                const initial = cust.name
                  ? cust.name.split(" ").pop()?.charAt(0).toUpperCase()
                  : "U";
                return (
                  <div key={cust._id} className="analytics-customer-item">
                    <div className="analytics-customer-avatar">{initial}</div>
                    <div style={{ flex: 1 }}>
                      <span style={{ fontWeight: 600, fontSize: "0.85rem", color: "#0f172a", display: "block" }}>
                        {cust.name}
                      </span>
                      <span style={{ fontSize: "0.72rem", color: "#94a3b8", display: "block" }}>
                        {cust.email}
                      </span>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <span style={{ fontSize: "0.75rem", color: "#64748b", display: "block", fontWeight: 500 }}>
                        Ngày đăng ký
                      </span>
                      <span style={{ fontSize: "0.72rem", color: "#94a3b8" }}>
                        {new Date(cust.createdAt).toLocaleDateString("vi-VN")}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* ❺ Section 5: Đánh giá (Reviews: 1/3 stars + 2/3 lists) */}
      <div className="analytics-split-grid-13">
        <div className="analytics-section-card">
          <h3 className="analytics-section-title">Thống kê xếp hạng sao</h3>
          <p className="analytics-section-subtitle">Phân bố đánh giá của khách hàng</p>

          <div style={{ textAlign: "center", marginBottom: "1.25rem" }}>
            <p style={{ fontSize: "3rem", fontWeight: 800, color: "#f59e0b", margin: 0, lineHeight: 1 }}>
              {reviewStats?.avgRating || "0.0"}
            </p>
            <div className="flex justify-center gap-0.5" style={{ margin: "0.35rem 0" }}>
              {[...Array(5)].map((_, i) => {
                const ratingVal = reviewStats?.avgRating || 0;
                return (
                  <Star
                    key={i}
                    size={16}
                    fill={i < Math.round(ratingVal) ? "#f59e0b" : "none"}
                    stroke="#f59e0b"
                  />
                );
              })}
            </div>
            <p style={{ fontSize: "0.75rem", color: "#94a3b8", margin: 0 }}>
              Dựa trên {reviewStats?.total || 0} đánh giá trong kỳ
            </p>
          </div>

          <div>
            {[5, 4, 3, 2, 1].map((stars) => {
              const count =
                reviewStats?.distribution?.find((d) => d.rating === stars)?.count || 0;
              const total = reviewStats?.total || 1;
              const pct = reviewStats?.total ? (count / total) * 100 : 0;
              return (
                <div key={stars} className="analytics-rating-row">
                  <span className="analytics-rating-row__label">{stars} ★</span>
                  <div className="analytics-rating-row__bar">
                    <div
                      className="analytics-rating-row__fill"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <span className="analytics-rating-row__count">{count}</span>
                </div>
              );
            })}
          </div>
        </div>

        <div className="analytics-section-card">
          <h3 className="analytics-section-title">Đánh giá sản phẩm mới nhất</h3>
          <p className="analytics-section-subtitle">
            Các đánh giá gửi bởi khách hàng trong khoảng thời gian đã lọc
          </p>

          <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
            {reviewStats?.recent.length === 0 ? (
              <p style={{ textAlign: "center", color: "#94a3b8", fontSize: "0.85rem", padding: "1.5rem" }}>
                Không có đánh giá nào trong thời gian này
              </p>
            ) : (
              reviewStats?.recent.map((rev) => (
                <div key={rev._id} className="analytics-review-item">
                  <div className="flex items-center justify-between" style={{ marginBottom: "0.25rem" }}>
                    <div>
                      <span style={{ fontWeight: 600, fontSize: "0.85rem", color: "#0f172a" }}>
                        {rev.userName}
                      </span>
                      <span style={{ fontSize: "0.72rem", color: "#94a3b8", marginLeft: "0.5rem" }}>
                        sản phẩm:{" "}
                        <strong style={{ color: "#475569" }}>
                          {rev.productName || "Sản phẩm đã bị xóa"}
                        </strong>
                      </span>
                    </div>
                    <span
                      style={{
                        fontSize: "0.7rem",
                        fontWeight: 700,
                        padding: "0.15rem 0.45rem",
                        borderRadius: "20px",
                        background: rev.isApproved
                          ? "rgba(16, 185, 129, 0.1)"
                          : "rgba(245, 158, 11, 0.1)",
                        color: rev.isApproved ? "#10b981" : "#f59e0b",
                      }}
                    >
                      {rev.isApproved ? "Đã duyệt" : "Chờ duyệt"}
                    </span>
                  </div>
                  <div className="flex gap-0.5" style={{ marginBottom: "0.25rem" }}>
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        size={12}
                        fill={i < rev.rating ? "#f59e0b" : "none"}
                        stroke="#f59e0b"
                      />
                    ))}
                  </div>
                  <p style={{ fontSize: "0.82rem", color: "#475569", margin: "0.2rem 0 0", lineHeight: 1.4 }}>
                    "{rev.content}"
                  </p>
                  <span style={{ fontSize: "0.7rem", color: "#94a3b8", display: "block", marginTop: "0.25rem", textAlign: "right" }}>
                    {new Date(rev.createdAt).toLocaleDateString("vi-VN")}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* ❻ Section 6: Cảnh báo tồn kho */}
      <div className="analytics-section-card">
        <div className="flex items-center justify-between" style={{ marginBottom: "1rem" }}>
          <div>
            <h3 className="analytics-section-title">
              <AlertTriangle size={18} className="text-rose-500 animate-pulse" />
              Cảnh báo tồn kho (Sản phẩm sắp hết)
            </h3>
            <p className="analytics-section-subtitle" style={{ margin: 0 }}>
              Danh sách sản phẩm cảnh báo tồn kho mức thấp (Tồn kho &le; 5)
            </p>
          </div>
          <Link
            href="/admin/plants"
            className="admin-dashboard__view-all-btn"
            style={{ fontSize: "0.75rem" }}
          >
            Quản lý kho
          </Link>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: "0.5rem" }}>
          {lowStock.length === 0 ? (
            <p style={{ textAlign: "center", color: "#059669", fontWeight: 600, fontSize: "0.85rem", padding: "1.5rem" }}>
              Không có sản phẩm nào sắp hết hàng! Kho hàng an toàn.
            </p>
          ) : (
            lowStock.map((plant) => {
              const isCritical = plant.stock === 0;
              return (
                <div
                  key={plant._id}
                  className={`analytics-stock-alert ${
                    isCritical
                      ? "analytics-stock-alert--critical"
                      : "analytics-stock-alert--warning"
                  }`}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                    {plant.imageCover ? (
                      <img
                        src={plant.imageCover}
                        alt={plant.name}
                        style={{
                          width: "38px",
                          height: "38px",
                          objectFit: "cover",
                          borderRadius: "8px",
                        }}
                      />
                    ) : (
                      <div
                        style={{
                          width: "38px",
                          height: "38px",
                          borderRadius: "8px",
                          background: "#e2e8f0",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        <Package size={16} className="text-slate-400" />
                      </div>
                    )}
                    <div>
                      <span
                        style={{
                          fontWeight: 600,
                          fontSize: "0.85rem",
                          color: isCritical ? "#991b1b" : "#92400e",
                          display: "block",
                        }}
                      >
                        {plant.name}
                      </span>
                      <span style={{ fontSize: "0.72rem", color: isCritical ? "#ef4444" : "#b45309" }}>
                        Danh mục: {plant.category}
                      </span>
                    </div>
                  </div>

                  <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                    <span
                      className="analytics-medal"
                      style={{
                        background: isCritical ? "#fee2e2" : "#fef3c7",
                        color: isCritical ? "#dc2626" : "#d97706",
                        width: "auto",
                        padding: "0.2rem 0.6rem",
                        borderRadius: "20px",
                      }}
                    >
                      Tồn kho: {plant.stock}
                    </span>
                    <Link
                      href={`/admin/plants?search=${encodeURIComponent(plant.name)}`}
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        justifyContent: "center",
                        width: "32px",
                        height: "32px",
                        borderRadius: "8px",
                        background: isCritical ? "#fee2e2" : "#fef3c7",
                        color: isCritical ? "#dc2626" : "#d97706",
                      }}
                    >
                      <ArrowUpRight size={16} />
                    </Link>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* ❼ Section 7: Top Selling Products Table */}
      <div className="analytics-section-card">
        <div className="admin-dashboard__orders-header">
          <div>
            <h3 className="analytics-section-title">
              <Award size={18} className="text-amber-500" />
              Sản phẩm bán chạy nhất trong kỳ
            </h3>
            <p className="analytics-section-subtitle" style={{ margin: 0 }}>
              Bảng xếp hạng sản phẩm có số lượng tiêu thụ tốt nhất trong kỳ báo cáo
            </p>
          </div>
        </div>

        {topProducts.length === 0 ? (
          <div style={{ textAlign: "center", padding: "3rem 1rem", color: "#94a3b8" }}>
            <TrendingUp size={40} style={{ color: "#cbd5e1", marginBottom: "0.5rem" }} />
            <p>Không có sản phẩm bán chạy trong khoảng thời gian này</p>
          </div>
        ) : (
          <div className="admin-dashboard__orders-table-wrap">
            <table className="admin-dashboard__orders-table">
              <thead>
                <tr>
                  <th style={{ width: "60px" }}>Xếp hạng</th>
                  <th>Sản phẩm</th>
                  <th>Phân loại</th>
                  <th>Số lượng bán</th>
                  <th>Đơn giá</th>
                  <th>Tổng doanh thu</th>
                </tr>
              </thead>
              <tbody>
                {topProducts.map((item, index) => {
                  const plant = item.product?.[0];
                  const rank = index + 1;
                  const topQty = topProducts[0]?.totalSold || 1;
                  const pct = (item.totalSold / topQty) * 100;

                  return (
                    <motion.tr
                      key={item._id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.3, delay: index * 0.04 }}
                    >
                      <td>
                        <span
                          className="analytics-medal"
                          style={{
                            background:
                              rank === 1
                                ? "#fef3c7"
                                : rank === 2
                                ? "#e2e8f0"
                                : rank === 3
                                ? "#ffedd5"
                                : "rgba(100, 116, 139, 0.08)",
                            color:
                              rank === 1
                                ? "#b45309"
                                : rank === 2
                                ? "#475569"
                                : rank === 3
                                ? "#c2410c"
                                : "#64748b",
                          }}
                        >
                          {rank}
                        </span>
                      </td>
                      <td>
                        <div className="admin-dashboard__customer-cell">
                          {plant?.imageCover ? (
                            <img
                              src={plant.imageCover}
                              alt={plant?.name}
                              className="admin-dashboard__product-thumb"
                              style={{ width: "42px", height: "42px" }}
                            />
                          ) : (
                            <div
                              className="admin-dashboard__customer-avatar"
                              style={{ width: "42px", height: "42px" }}
                            >
                              <Package size={16} />
                            </div>
                          )}
                          <div>
                            <span
                              className="admin-dashboard__customer-name"
                              style={{ fontSize: "0.9rem" }}
                            >
                              {plant?.name || "Sản phẩm đã bị xóa"}
                            </span>
                            <span className="admin-dashboard__customer-email">
                              ID: #{item._id.slice(-8).toUpperCase()}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td>
                        <span className="admin-dashboard__date-cell">
                          {plant?.category || "Chưa phân loại"}
                        </span>
                      </td>
                      <td>
                        <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem", width: "120px" }}>
                          <span className="admin-dashboard__amount" style={{ color: "#059669", fontSize: "0.9rem" }}>
                            {item.totalSold} sp
                          </span>
                          <div className="analytics-progress-bar">
                            <div
                              className="analytics-progress-bar__fill"
                              style={{
                                width: `${pct}%`,
                                background: "linear-gradient(135deg, #059669, #10b981)",
                              }}
                            />
                          </div>
                        </div>
                      </td>
                      <td>
                        <span className="admin-dashboard__amount" style={{ fontSize: "0.9rem", fontWeight: 500 }}>
                          {plant ? formatCurrency(plant.price) : "—"}
                        </span>
                      </td>
                      <td>
                        <span className="admin-dashboard__amount" style={{ fontSize: "0.9rem" }}>
                          {formatCurrency(item.revenue)}
                        </span>
                      </td>
                    </motion.tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
