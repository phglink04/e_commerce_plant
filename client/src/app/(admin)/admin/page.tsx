"use client";
import { useAdminDashboard } from "@/hooks/admin/useAdminDashboard";
import { StatCard } from "@/components/admin/Cards/StatCard";
import { MiniStatCard } from "@/components/admin/Cards/MiniStatCard";
import { RevenueChart } from "@/components/admin/Charts/RevenueChart";
import { OrderStatusChart } from "@/components/admin/Charts/OrderStatusChart";
import {
  ShoppingCart,
  Package,
  Users,
  DollarSign,
  RefreshCw,
  Clock,
  AlertTriangle,
  UserPlus,
  CalendarDays,
  ArrowUpRight,
  Eye,
} from "lucide-react";
import { useState, useEffect } from "react";
import { dashboardService } from "@/services/admin/dashboard.service";
import { RecentOrder } from "@/types/admin";
import { motion } from "framer-motion";
import Link from "next/link";

export default function DashboardPage() {
  const { stats, loading, error, refetch } = useAdminDashboard();
  const [recentOrders, setRecentOrders] = useState<RecentOrder[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(true);

  const fetchRecentOrders = async () => {
    try {
      setOrdersLoading(true);
      const response = await dashboardService.getRecentOrders(5);
      setRecentOrders(response.data || []);
    } catch {
      setRecentOrders([]);
    } finally {
      setOrdersLoading(false);
    }
  };

  useEffect(() => {
    fetchRecentOrders();
  }, []);

  const handleRefresh = async () => {
    await Promise.all([refetch(), fetchRecentOrders()]);
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(value);
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Chào buổi sáng";
    if (hour < 18) return "Chào buổi chiều";
    return "Chào buổi tối";
  };

  const getStatusConfig = (status: string) => {
    const configs: Record<
      string,
      { label: string; bg: string; color: string; dot: string }
    > = {
      pending: {
        label: "Chờ xử lý",
        bg: "rgba(245, 158, 11, 0.1)",
        color: "#d97706",
        dot: "#f59e0b",
      },
      processing: {
        label: "Đang xử lý",
        bg: "rgba(59, 130, 246, 0.1)",
        color: "#2563eb",
        dot: "#3b82f6",
      },
      shipped: {
        label: "Đang giao",
        bg: "rgba(139, 92, 246, 0.1)",
        color: "#7c3aed",
        dot: "#8b5cf6",
      },
      delivered: {
        label: "Đã giao",
        bg: "rgba(16, 185, 129, 0.1)",
        color: "#059669",
        dot: "#10b981",
      },
      completed: {
        label: "Hoàn thành",
        bg: "rgba(5, 150, 105, 0.1)",
        color: "#047857",
        dot: "#059669",
      },
      cancelled: {
        label: "Đã hủy",
        bg: "rgba(239, 68, 68, 0.1)",
        color: "#dc2626",
        dot: "#ef4444",
      },
    };
    return (
      configs[status] || {
        label: status,
        bg: "#f1f5f9",
        color: "#64748b",
        dot: "#94a3b8",
      }
    );
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
          <h1 className="admin-dashboard__title">{getGreeting()} 👋</h1>
          <p className="admin-dashboard__subtitle">
            Đây là tổng quan hoạt động cửa hàng hôm nay
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
            Làm mới
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

      {/* ── Primary Stats ── */}
      <div className="admin-dashboard__stats-grid">
        <StatCard
          label="Tổng doanh thu"
          value={formatCurrency(stats?.revenue.total || 0)}
          icon={<DollarSign size={24} />}
          trend={{ value: 12, direction: "up" }}
          color="emerald"
          delay={0}
        />
        <StatCard
          label="Tổng đơn hàng"
          value={stats?.orders.total || 0}
          icon={<ShoppingCart size={24} />}
          trend={{ value: 8, direction: "up" }}
          color="blue"
          delay={1}
        />
        <StatCard
          label="Sản phẩm"
          value={stats?.products.total || 0}
          icon={<Package size={24} />}
          color="violet"
          delay={2}
        />
        <StatCard
          label="Người dùng"
          value={stats?.users.total || 0}
          icon={<Users size={24} />}
          trend={{ value: 5, direction: "up" }}
          color="amber"
          delay={3}
        />
      </div>

      {/* ── Secondary Stats ── */}
      <div className="admin-dashboard__mini-stats-grid">
        <MiniStatCard
          label="Doanh thu tháng này"
          value={formatCurrency(stats?.revenue.thisMonth || 0)}
          icon={<CalendarDays size={18} />}
          color="#059669"
          bgColor="rgba(16, 185, 129, 0.1)"
          delay={4}
        />
        <MiniStatCard
          label="Đơn chờ xử lý"
          value={stats?.orders.pending || 0}
          icon={<Clock size={18} />}
          color="#d97706"
          bgColor="rgba(245, 158, 11, 0.1)"
          delay={5}
        />
        <MiniStatCard
          label="Hết hàng"
          value={stats?.products.outOfStock || 0}
          icon={<AlertTriangle size={18} />}
          color="#ef4444"
          bgColor="rgba(239, 68, 68, 0.1)"
          delay={6}
        />
        <MiniStatCard
          label="Người dùng mới (tháng)"
          value={stats?.users.newThisMonth || 0}
          icon={<UserPlus size={18} />}
          color="#3b82f6"
          bgColor="rgba(59, 130, 246, 0.1)"
          delay={7}
        />
      </div>

      {/* ── Charts ── */}
      <div className="admin-dashboard__charts-grid">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="admin-dashboard__chart-card"
        >
          <RevenueChart />
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="admin-dashboard__chart-card"
        >
          <OrderStatusChart />
        </motion.div>
      </div>

      {/* ── Recent Orders ── */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.5 }}
        className="admin-dashboard__orders-card"
      >
        <div className="admin-dashboard__orders-header">
          <div>
            <h3 className="admin-dashboard__orders-title">
              Đơn hàng gần đây
            </h3>
            <p className="admin-dashboard__orders-subtitle">
              5 đơn hàng mới nhất
            </p>
          </div>
          <Link href="/admin/orders" className="admin-dashboard__view-all-btn">
            Xem tất cả
            <ArrowUpRight size={14} />
          </Link>
        </div>

        {ordersLoading ? (
          <div className="admin-dashboard__orders-loader">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="admin-dashboard__skeleton-row">
                <div className="admin-dashboard__skeleton admin-dashboard__skeleton--avatar" />
                <div style={{ flex: 1 }}>
                  <div className="admin-dashboard__skeleton admin-dashboard__skeleton--line" />
                  <div className="admin-dashboard__skeleton admin-dashboard__skeleton--line-short" />
                </div>
                <div className="admin-dashboard__skeleton admin-dashboard__skeleton--badge" />
              </div>
            ))}
          </div>
        ) : recentOrders.length === 0 ? (
          <div className="admin-dashboard__orders-empty">
            <ShoppingCart
              size={40}
              style={{ color: "#cbd5e1", marginBottom: "0.5rem" }}
            />
            <p>Chưa có đơn hàng nào</p>
          </div>
        ) : (
          <div className="admin-dashboard__orders-table-wrap">
            <table className="admin-dashboard__orders-table">
              <thead>
                <tr>
                  <th>Mã đơn</th>
                  <th>Khách hàng</th>
                  <th>Tổng tiền</th>
                  <th>Trạng thái</th>
                  <th>Ngày tạo</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {recentOrders.map((order, index) => {
                  const statusCfg = getStatusConfig(order.orderStatus);
                  return (
                    <motion.tr
                      key={order._id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.3, delay: index * 0.06 }}
                    >
                      <td>
                        <span className="admin-dashboard__order-id">
                          #{order._id.slice(-6).toUpperCase()}
                        </span>
                      </td>
                      <td>
                        <div className="admin-dashboard__customer-cell">
                          <div className="admin-dashboard__customer-avatar">
                            {(
                              order.userId?.name?.[0] ||
                              order.userId?.email?.[0] ||
                              "?"
                            ).toUpperCase()}
                          </div>
                          <div>
                            <span className="admin-dashboard__customer-name">
                              {order.userId?.name || "Ẩn danh"}
                            </span>
                            <span className="admin-dashboard__customer-email">
                              {order.userId?.email || ""}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td>
                        <span className="admin-dashboard__amount">
                          {formatCurrency(order.total || order.totalAmount)}
                        </span>
                      </td>
                      <td>
                        <span
                          className="admin-dashboard__status-badge"
                          style={{
                            background: statusCfg.bg,
                            color: statusCfg.color,
                          }}
                        >
                          <span
                            className="admin-dashboard__status-dot"
                            style={{ background: statusCfg.dot }}
                          />
                          {statusCfg.label}
                        </span>
                      </td>
                      <td>
                        <span className="admin-dashboard__date-cell">
                          {new Date(order.createdAt).toLocaleDateString(
                            "vi-VN",
                            {
                              day: "2-digit",
                              month: "2-digit",
                              year: "numeric",
                            }
                          )}
                        </span>
                      </td>
                      <td>
                        <Link
                          href={`/admin/orders`}
                          className="admin-dashboard__order-view-btn"
                        >
                          <Eye size={14} />
                        </Link>
                      </td>
                    </motion.tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </motion.div>
    </div>
  );
}
