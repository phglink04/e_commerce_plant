"use client";
import { useAdminDashboard } from "@/hooks/admin/useAdminDashboard";
import { StatCard } from "@/components/admin/Cards/StatCard";
import { LineChart } from "@/components/admin/Charts/LineChart";
import { BarChart } from "@/components/admin/Charts/BarChart";
import {
  ShoppingCart,
  Package,
  Users,
  DollarSign,
  RefreshCw,
} from "lucide-react";
import { useState, useEffect } from "react";
import { dashboardService } from "@/services/admin/dashboard.service";
import { RecentOrder } from "@/types/admin";

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
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(value);
  };

  return (
      <div className="space-y-6">
        {/* Page Title */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Dashboard</h1>
            <p className="text-slate-600 mt-1">Welcome to admin panel</p>
          </div>
          <button
            onClick={handleRefresh}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50"
          >
            <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
            Refresh
          </button>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg">
            {error}
          </div>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard
            label="Total Revenue"
            value={formatCurrency(stats?.revenue.total || 0)}
            icon={<DollarSign />}
            trend={{ value: 12, direction: "up" }}
            color="emerald"
          />
          <StatCard
            label="Total Orders"
            value={stats?.orders.total || 0}
            icon={<ShoppingCart />}
            trend={{ value: 8, direction: "up" }}
            color="blue"
          />
          <StatCard
            label="Total Products"
            value={stats?.products.total || 0}
            icon={<Package />}
            color="orange"
          />
          <StatCard
            label="Total Users"
            value={stats?.users.total || 0}
            icon={<Users />}
            color="red"
          />
        </div>

        {/* Additional Stats Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white rounded-lg border border-slate-200 p-4">
            <p className="text-sm text-slate-600">This Month Revenue</p>
            <p className="text-2xl font-bold mt-2">
              {formatCurrency(stats?.revenue.thisMonth || 0)}
            </p>
          </div>
          <div className="bg-white rounded-lg border border-slate-200 p-4">
            <p className="text-sm text-slate-600">Pending Orders</p>
            <p className="text-2xl font-bold mt-2 text-yellow-600">
              {stats?.orders.pending || 0}
            </p>
          </div>
          <div className="bg-white rounded-lg border border-slate-200 p-4">
            <p className="text-sm text-slate-600">Out of Stock</p>
            <p className="text-2xl font-bold mt-2 text-red-600">
              {stats?.products.outOfStock || 0}
            </p>
          </div>
          <div className="bg-white rounded-lg border border-slate-200 p-4">
            <p className="text-sm text-slate-600">New Users This Month</p>
            <p className="text-2xl font-bold mt-2 text-blue-600">
              {stats?.users.newThisMonth || 0}
            </p>
          </div>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-lg border border-slate-200 p-6">
            <h3 className="text-lg font-semibold mb-4">Revenue This Week</h3>
            <LineChart />
          </div>
          <div className="bg-white rounded-lg border border-slate-200 p-6">
            <h3 className="text-lg font-semibold mb-4">Orders by Status</h3>
            <BarChart />
          </div>
        </div>

        {/* Recent Orders */}
        <div className="bg-white rounded-lg border border-slate-200 p-6">
          <h3 className="text-lg font-semibold mb-4">Recent Orders</h3>
          {ordersLoading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
            </div>
          ) : recentOrders.length === 0 ? (
            <p className="text-center text-slate-500 py-8">No orders yet</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50 border-b">
                  <tr>
                    <th className="text-left px-4 py-3 text-sm font-semibold">
                      Order ID
                    </th>
                    <th className="text-left px-4 py-3 text-sm font-semibold">
                      Customer
                    </th>
                    <th className="text-left px-4 py-3 text-sm font-semibold">
                      Amount
                    </th>
                    <th className="text-left px-4 py-3 text-sm font-semibold">
                      Status
                    </th>
                    <th className="text-left px-4 py-3 text-sm font-semibold">
                      Date
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {recentOrders.map((order) => (
                    <tr key={order._id} className="hover:bg-slate-50">
                      <td className="px-4 py-3 text-sm font-mono text-slate-600">
                        {order._id.slice(-8)}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        {order.userId?.name || order.userId?.email || "Unknown"}
                      </td>
                      <td className="px-4 py-3 text-sm font-semibold">
                        {formatCurrency(order.total || order.totalAmount)}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-semibold ${
                            order.orderStatus === "delivered"
                              ? "bg-green-100 text-green-800"
                              : order.orderStatus === "pending"
                                ? "bg-yellow-100 text-yellow-800"
                                : order.orderStatus === "processing"
                                  ? "bg-blue-100 text-blue-800"
                                  : order.orderStatus === "cancelled"
                                    ? "bg-red-100 text-red-800"
                                    : "bg-slate-100 text-slate-800"
                          }`}
                        >
                          {order.orderStatus}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-600">
                        {new Date(order.createdAt).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
  );
}
