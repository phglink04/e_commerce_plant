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
} from "lucide-react";
import { useState, useEffect } from "react";
import { dashboardService } from "@/services/admin/dashboard.service";
import { chatbotService } from "@/services/chatbot.service";
import { RecentOrder, TopProduct, LowStockProduct, TopCustomer } from "@/types/admin";
import { motion } from "framer-motion";
import { RevenueChart } from "@/components/admin/Charts/RevenueChart";
import { OrderStatusChart } from "@/components/admin/Charts/OrderStatusChart";

// Sub-components
import KPICard from "@/components/admin/Dashboard/KPICard";
import ChatAlertBanner from "@/components/admin/Dashboard/ChatAlertBanner";
import TopProductsWidget from "@/components/admin/Dashboard/TopProductsWidget";
import TopCustomersWidget from "@/components/admin/Dashboard/TopCustomersWidget";
import LowStockWidget from "@/components/admin/Dashboard/LowStockWidget";

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

  const [topCustomers, setTopCustomers] = useState<TopCustomer[]>([]);
  const [topCustomersLoading, setTopCustomersLoading] = useState(true);

  const fetchTopCustomers = async () => {
    try {
      setTopCustomersLoading(true);
      const response = await dashboardService.getTopCustomers(5);
      setTopCustomers(response.data || []);
    } catch {
      setTopCustomers([]);
    } finally {
      setTopCustomersLoading(false);
    }
  };

  useEffect(() => {
    fetchTopProducts();
    fetchLowStockProducts();
    fetchChatStats();
    fetchTopCustomers();
  }, []);

  const handleRefresh = async () => {
    await Promise.all([
      refetch(),
      fetchTopProducts(),
      fetchLowStockProducts(),
      fetchChatStats(),
      fetchTopCustomers(),
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
      <ChatAlertBanner pendingChats={chatStats?.pendingChats ?? 0} />

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
          subText={`Hôm nay: +${stats?.orders.today || 0} đơn mới`}
          trend={{ value: "8.2%", isUp: true, label: "so với hôm qua" }}
          icon={<ShoppingCart size={20} />}
          color="blue"
          delay={1}
        />
        <KPICard
          title="Khách hàng mới"
          value={stats?.users.total || 0}
          subText={`Hôm nay: +${stats?.users.today || 0} | Tháng này: +${stats?.users.newThisMonth || 0}`}
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
        <TopProductsWidget
          loading={topLoading}
          products={topProducts}
          formatCurrency={formatCurrency}
        />

        <TopCustomersWidget
          loading={topCustomersLoading}
          customers={topCustomers}
          formatCurrency={formatCurrency}
        />

        <LowStockWidget
          loading={lowStockLoading}
          products={lowStockProducts}
        />
      </div>
    </div>
  );
}
