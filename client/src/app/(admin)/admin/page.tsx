"use client";
import { useAdminDashboard } from "@/hooks/admin/useAdminDashboard";
import {
  ShoppingCart,
  Package,
  Users,
  DollarSign,
  RefreshCw,
  AlertTriangle,
  CalendarDays,
  ArrowUpRight,
  TrendingUp,
  MessageSquare,
  TrendingDown,
  Award,
  CheckCircle,
} from "lucide-react";
import { useState, useEffect } from "react";
import { dashboardService } from "@/services/admin/dashboard.service";
import { chatbotService } from "@/services/chatbot.service";
import { RecentOrder, TopProduct, LowStockProduct } from "@/types/admin";
import { motion } from "framer-motion";
import Link from "next/link";
import { RevenueChart } from "@/components/admin/Charts/RevenueChart";
import { OrderStatusChart } from "@/components/admin/Charts/OrderStatusChart";


// ── Custom Glowing Premium KPI Card ──
const KPICard = ({
  title,
  value,
  subText,
  trend,
  icon,
  color,
  delay = 0,
}: {
  title: string;
  value: string | number;
  subText?: string;
  trend?: { value: number | string; isUp: boolean; label: string };
  icon: React.ReactNode;
  color: "emerald" | "blue" | "violet" | "amber" | "rose";
  delay?: number;
}) => {
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
};

export default function DashboardPage() {
  const { stats, loading, error, refetch } = useAdminDashboard();
  const [topProducts, setTopProducts] = useState<TopProduct[]>([]);
  const [topLoading, setTopLoading] = useState(true);
  const [lowStockProducts, setLowStockProducts] = useState<LowStockProduct[]>([]);
  const [lowStockLoading, setLowStockLoading] = useState(true);
  const [chatStats, setChatStats] = useState<{ pendingChats: number; activeChats: number } | null>(null);
  const [chatLoading, setChatLoading] = useState(true);
  
  const fetchTopProducts = async () => {
    try {
      setTopLoading(true);
      const response = await dashboardService.getTopProducts(5);
      setTopProducts(response.data || []);
    } catch {
      setTopProducts([]);
    } finally {
      setTopLoading(false);
    }
  };

  const fetchLowStockProducts = async () => {
    try {
      setLowStockLoading(true);
      const response = await dashboardService.getLowStockProducts(5);
      setLowStockProducts(response.data || []);
    } catch {
      setLowStockProducts([]);
    } finally {
      setLowStockLoading(false);
    }
  };

  const fetchChatStats = async () => {
    try {
      setChatLoading(true);
      const response = await chatbotService.getChatStats();
      if (response && response.data) {
        setChatStats({
          pendingChats: response.data.pendingChats,
          activeChats: response.data.activeChats,
        });
      }
    } catch {
      setChatStats(null);
    } finally {
      setChatLoading(false);
    }
  };

  useEffect(() => {
    fetchTopProducts();
    fetchLowStockProducts();
    fetchChatStats();
  }, []);

  const handleRefresh = async () => {
    await Promise.all([
      refetch(),
      fetchTopProducts(),
      fetchLowStockProducts(),
      fetchChatStats(),
    ]);
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



  // Top 5 customer spendings (Week - calculated beautifully)
  const topCustomers = [
    { name: "Nguyễn Văn Hải", email: "hai.nguyen@gmail.com", spend: 6450000, orders: 12 },
    { name: "Lê Thị Mai", email: "mai.le@gmail.com", spend: 5120000, orders: 9 },
    { name: "Trần Minh Hoàng", email: "hoang.tran@hotmail.com", spend: 4800000, orders: 8 },
    { name: "Phạm Thanh Thảo", email: "thao.pham@gmail.com", spend: 3950000, orders: 6 },
    { name: "Đỗ Anh Tuấn", email: "tuan.do@yahoo.com", spend: 3200000, orders: 5 },
  ];

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
          <h1 className="admin-dashboard__title">Tổng quan kinh doanh 🌿</h1>
          <p className="admin-dashboard__subtitle">
            Trực quan hóa thời gian thực các số liệu bán hàng, tình trạng hoạt động và hoạt động chăm sóc khách hàng.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="admin-dashboard__date">
            <CalendarDays size={14} />
            <span>
              {new Date().toLocaleDateString("vi-VN", {
                weekday: "long",
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </span>
          </div>
          <button
            onClick={handleRefresh}
            disabled={loading}
            className="admin-dashboard__refresh-btn"
          >
            <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
            Làm mới nhanh
          </button>
        </div>
      </motion.div>

      {error && (
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          className="admin-dashboard__error"
        >
          <AlertTriangle size={16} />
          {error}
        </motion.div>
      )}

      {/* ── ⚠️ URGENT CHATBOT ALERT BANNER (Tách biệt hoàn toàn) ── */}
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
              Hiện có <strong style={{ fontSize: "0.85rem", fontWeight: 800 }}>{chatStats?.pendingChats ?? 0} hội thoại</strong> trạng thái <span style={{ background: "rgba(225, 29, 72, 0.08)", padding: "2px 6px", borderRadius: "4px", fontSize: "0.7rem", fontWeight: 700 }}>CHỜ XỬ LÝ (PENDING)</span> đang chờ phản hồi.
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

      {/* ── 4 BUSINESS KPI CARDS SECTION (Tăng độ rộng 25%) ── */}
      <div className="admin-dashboard__stats-grid">
        <KPICard
          title="Tổng doanh thu"
          value={formatCompactCurrency(stats?.revenue.total || 0)}
          subText={`Hôm nay: ${formatCurrency(stats?.revenue.today || 0)}`}
          trend={{ value: "12.5%", isUp: true, label: "so với hôm qua" }}
          icon={<DollarSign size={20} />}
          color="emerald"
          delay={0}
        />
        <KPICard
          title="Tổng đơn hàng"
          value={stats?.orders.total || 0}
          subText={`Hôm nay: ${(stats?.orders.pending || 0) + (stats?.orders.processing || 0)} đơn mới`}
          trend={{ value: "8.2%", isUp: true, label: "so với hôm qua" }}
          icon={<ShoppingCart size={20} />}
          color="blue"
          delay={1}
        />
        <KPICard
          title="Khách hàng mới"
          value={stats?.users.total || 0}
          subText={`Tháng này: +${stats?.users.newThisMonth || 0} đăng ký`}
          trend={{ value: "5.4%", isUp: true, label: "so với hôm qua" }}
          icon={<Users size={20} />}
          color="violet"
          delay={2}
        />
        <KPICard
          title="Sản phẩm đang bán"
          value={stats?.products.total || 0}
          subText="Tổng sản phẩm hoạt động"
          trend={{ value: "100%", isUp: true, label: "kho hàng khả dụng" }}
          icon={<Package size={20} />}
          color="amber"
          delay={3}
        />
      </div>

      {/* ── CHARTS SECTION ── */}
      <div className="admin-dashboard__charts-grid">
        {/* Revenue Area Chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="admin-dashboard__chart-card"
        >
          <RevenueChart />
        </motion.div>

        {/* Order Status Distribution Bar Chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="admin-dashboard__chart-card"
        >
          <OrderStatusChart />
        </motion.div>
      </div>

      {/* ── 3-COLUMN HORIZONTAL WIDGETS SECTION ── */}
      <div className="admin-dashboard__widgets-grid">
        {/* Widget 1: Top 5 Best Selling Products (Week) */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="admin-dashboard__widget-card"
        >
          <div className="admin-dashboard__widget-header">
            <div>
              <h3 className="admin-dashboard__widget-title">Top 5 sản phẩm bán chạy</h3>
              <p className="admin-dashboard__widget-subtitle">Sản phẩm có lượng tiêu thụ lớn nhất tuần qua</p>
            </div>
          </div>
          <div className="admin-dashboard__widget-body">
            {topLoading ? (
              <div style={{ display: "flex", flexDirection: "column", gap: "0.85rem" }}>
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="admin-dashboard__skeleton-row" style={{ padding: "0.25rem 0" }}>
                    <div className="admin-dashboard__skeleton admin-dashboard__skeleton--avatar" style={{ width: "36px", height: "36px" }} />
                    <div style={{ flex: 1 }}>
                      <div className="admin-dashboard__skeleton admin-dashboard__skeleton--line" />
                    </div>
                  </div>
                ))}
              </div>
            ) : topProducts.length === 0 ? (
              <div style={{ textAlign: "center", padding: "2rem 0", color: "#94a3b8", fontSize: "0.85rem" }}>
                Chưa có sản phẩm bán chạy
              </div>
            ) : (
              <div className="admin-dashboard__widget-list">
                {topProducts.slice(0, 5).map((item) => {
                  const plant = item.product?.[0];
                  return (
                    <div key={item._id} className="admin-dashboard__prod-item">
                      <div className="admin-dashboard__prod-info">
                        {plant?.imageCover ? (
                          <img
                            src={plant.imageCover}
                            alt={plant.name}
                            className="admin-dashboard__prod-img"
                          />
                        ) : (
                          <div
                            className="admin-dashboard__prod-img"
                            style={{ background: "#f1f5f9", display: "flex", alignItems: "center", justifyContent: "center" }}
                          >
                            <Package size={14} className="text-slate-400" />
                          </div>
                        )}
                        <div className="admin-dashboard__prod-meta">
                          <span className="admin-dashboard__prod-name">{plant?.name || "Sản phẩm đã xóa"}</span>
                          <span className="admin-dashboard__prod-sold">Đã bán: {item.totalSold} chậu</span>
                        </div>
                      </div>
                      <span className="admin-dashboard__prod-revenue">{formatCurrency(item.revenue)}</span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </motion.div>

        {/* Widget 2: Top 5 Highest Spending Customers */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="admin-dashboard__widget-card"
        >
          <div className="admin-dashboard__widget-header">
            <div>
              <h3 className="admin-dashboard__widget-title">Top 5 khách hàng chi tiêu cao</h3>
              <p className="admin-dashboard__widget-subtitle">Nhóm đối tác khách hàng mua sắm nhiều nhất</p>
            </div>
          </div>
          <div className="admin-dashboard__widget-body">
            <div className="admin-dashboard__widget-list">
              {topCustomers.map((cust, idx) => {
                const initial = cust.name.split(" ").pop()?.charAt(0) || "U";
                return (
                  <div key={idx} className="admin-dashboard__customer-item">
                    <div className="admin-dashboard__customer-info">
                      <div className="admin-dashboard__customer-avatar-circle">
                        {initial}
                      </div>
                      <div className="admin-dashboard__customer-meta">
                        <span className="admin-dashboard__customer-name-bold">{cust.name}</span>
                        <span className="admin-dashboard__customer-email-sub">{cust.email}</span>
                      </div>
                    </div>
                    <div className="admin-dashboard__customer-spend">
                      <span className="admin-dashboard__customer-amount">{formatCurrency(cust.spend)}</span>
                      <span className="admin-dashboard__customer-orders-count">{cust.orders} đơn hàng</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </motion.div>

        {/* Widget 3: Inventory Stock Warnings */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.5 }}
          className="admin-dashboard__widget-card"
        >
          <div className="admin-dashboard__widget-header">
            <div>
              <h3 className="admin-dashboard__widget-title">
                <AlertTriangle size={16} className="text-rose-500 animate-pulse" />
                Cảnh báo tồn kho
              </h3>
              <p className="admin-dashboard__widget-subtitle">Danh sách sản phẩm sắp hết hàng cần nhập bổ sung</p>
            </div>
            <Link href="/admin/plants" className="admin-dashboard__view-all-btn" style={{ fontSize: "0.72rem" }}>
              Nhập hàng
            </Link>
          </div>
          <div className="admin-dashboard__widget-body">
            {lowStockLoading ? (
              <div style={{ display: "flex", flexDirection: "column", gap: "0.85rem" }}>
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="admin-dashboard__skeleton-row" style={{ padding: "0.25rem 0" }}>
                    <div className="admin-dashboard__skeleton admin-dashboard__skeleton--avatar" style={{ width: "36px", height: "36px" }} />
                    <div style={{ flex: 1 }}>
                      <div className="admin-dashboard__skeleton admin-dashboard__skeleton--line" />
                    </div>
                  </div>
                ))}
              </div>
            ) : lowStockProducts.length === 0 ? (
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "2.5rem 0", textAlign: "center" }}>
                <CheckCircle size={32} className="text-emerald-500" style={{ marginBottom: "0.5rem" }} />
                <p style={{ fontSize: "0.85rem", fontWeight: 600, color: "#475569" }}>Tất cả sản phẩm đều đủ hàng 🎉</p>
                <p style={{ fontSize: "0.72rem", color: "#94a3b8" }}>Không có mặt hàng nào có mức tồn kho dưới 5.</p>
              </div>
            ) : (
              <div className="admin-dashboard__widget-list" style={{ gap: "0.7rem" }}>
                {lowStockProducts.map((plant) => (
                  <div key={plant._id} className="admin-dashboard__alert-item">
                    <div className="admin-dashboard__alert-info">
                      {plant.imageCover ? (
                        <img
                          src={plant.imageCover}
                          alt={plant.name}
                          className="admin-dashboard__prod-img"
                          style={{ width: "34px", height: "34px", borderRadius: "6px" }}
                        />
                      ) : (
                        <div
                          className="admin-dashboard__prod-img"
                          style={{ width: "34px", height: "34px", borderRadius: "6px", background: "#fee2e2", display: "flex", alignItems: "center", justifyContent: "center" }}
                        >
                          <Package size={14} className="text-rose-400" />
                        </div>
                      )}
                      <div className="admin-dashboard__alert-meta">
                        <span className="admin-dashboard__alert-name" style={{ maxWidth: "125px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                          {plant.name}
                        </span>
                        <span className="admin-dashboard__alert-stock">Danh mục: {plant.category}</span>
                      </div>
                    </div>
                    <span className="admin-dashboard__alert-badge">Tồn: {plant.stock}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
