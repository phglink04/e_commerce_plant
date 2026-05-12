"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Search, ClipboardList } from "lucide-react";
import StatusBadge from "@/components/admin/ui/status-badge";
import StatusTabs from "@/components/admin/ui/status-tabs";
import OrderTimeline from "@/components/admin/ui/order-timeline";
import Drawer from "@/components/admin/ui/drawer";
import AdminToast from "@/components/admin/ui/admin-toast";
import DataTable from "@/components/admin/ui/data-table";
import {
  getOrders,
  updateOrderStatus,
  type AdminOrder,
  type AdminOrderStatus,
} from "@/lib/admin-api";
import {
  ORDER_STATUS_OPTIONS,
  PAYMENT_STATUS_OPTIONS,
  orderStatusLabel,
  paymentStatusLabel,
} from "@/lib/order-status";
import { useAuthStore } from "@/store/auth-store";

type StatusFilter = "all" | AdminOrderStatus;

const ORDER_STEPS = [
  { label: "Pending", description: "Order received" },
  { label: "Confirmed", description: "Payment confirmed" },
  { label: "Processing", description: "Being prepared" },
  { label: "Shipped", description: "On the way" },
  { label: "Delivered", description: "Delivered to customer" },
];

const STATUS_ORDER = ["Pending", "Confirmed", "Processing", "Shipped", "Delivered"];

function getStepIndex(status: string): number {
  const label = orderStatusLabel(status);
  return STATUS_ORDER.indexOf(label);
}

export default function AdminOrdersPage() {
  const { token } = useAuthStore();
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [totalResults, setTotalResults] = useState(0);
  const [loading, setLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [selectedOrder, setSelectedOrder] = useState<AdminOrder | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [updatingOrderId, setUpdatingOrderId] = useState<string | null>(null);
  const [pendingStatus, setPendingStatus] = useState<Record<string, AdminOrderStatus>>({});
  const [toast, setToast] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  // Debounce search
  useEffect(() => {
    const t = window.setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 300);
    return () => window.clearTimeout(t);
  }, [search]);

  useEffect(() => setPage(1), [statusFilter]);

  const loadOrders = useCallback(async () => {
    if (!token) return;
    try {
      setLoading(true);
      const data = await getOrders(
        {
          page,
          limit: pageSize,
          search: debouncedSearch,
          orderStatus: statusFilter === "all" ? undefined : statusFilter,
        },
        token,
      );
      setOrders(data.items);
      setTotalPages(data.totalPages);
      setTotalResults(data.totalResults);
    } catch (error) {
      setToast({
        type: "error",
        message: error instanceof Error ? error.message : "Unable to load orders.",
      });
    } finally {
      setLoading(false);
    }
  }, [token, page, pageSize, debouncedSearch, statusFilter]);

  useEffect(() => {
    void loadOrders();
  }, [loadOrders]);

  const statusCounts = useMemo(() => {
    const c: Record<string, number> = { all: totalResults };
    return c;
  }, [totalResults]);

  const tabs = [
    { value: "all" as const, label: "All", count: totalResults },
    ...ORDER_STATUS_OPTIONS.map((s) => ({
      value: s.value as StatusFilter,
      label: s.label,
    })),
  ];

  const handleUpdateStatus = async (orderId: string) => {
    if (!token) return;
    const newStatus = pendingStatus[orderId];
    if (!newStatus) return;
    try {
      setUpdatingOrderId(orderId);
      await updateOrderStatus(orderId, newStatus, token);
      setToast({ type: "success", message: "Order status updated." });
      setOrders((prev) =>
        prev.map((o) => (o.id === orderId ? { ...o, orderStatus: newStatus } : o)),
      );
      // update drawer if open
      if (selectedOrder?.id === orderId) {
        setSelectedOrder((prev) =>
          prev ? { ...prev, orderStatus: newStatus } : prev,
        );
      }
    } catch (error) {
      setToast({
        type: "error",
        message: error instanceof Error ? error.message : "Unable to update status.",
      });
    } finally {
      setUpdatingOrderId(null);
    }
  };

  const openDetail = (order: AdminOrder) => {
    setSelectedOrder(order);
    setDrawerOpen(true);
  };

  const statusOptions = ORDER_STATUS_OPTIONS.map((o) => o.value);

  return (
    <section className="space-y-5">
      {/* Header */}
      <header className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900">Orders</h2>
          <p className="mt-0.5 text-sm text-slate-500">
            {totalResults.toLocaleString()} total orders
          </p>
        </div>
      </header>

      {/* Status Tabs */}
      <StatusTabs tabs={tabs} value={statusFilter} onChange={setStatusFilter} />

      {/* Search */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search
            size={15}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
          />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by order ID, user, address…"
            className="w-full rounded-xl border border-slate-200 bg-white py-2 pl-9 pr-3 text-sm outline-none transition focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100"
          />
        </div>
        {loading && (
          <span className="inline-flex items-center gap-1.5 text-xs text-slate-400">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" />
            Loading…
          </span>
        )}
      </div>

      {/* Loading skeleton */}
      {loading && (
        <div className="space-y-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="h-14 animate-pulse rounded-xl bg-slate-100"
            />
          ))}
        </div>
      )}

      {/* Table */}
      {!loading && (
        <DataTable
          columns={[
            {
              key: "id",
              title: "Order ID",
              render: (row) => (
                <span className="font-mono text-xs text-slate-500">
                  #{row.id.slice(-10).toUpperCase()}
                </span>
              ),
            },
            {
              key: "date",
              title: "Date",
              render: (row) => (
                <span className="text-xs text-slate-500">
                  {new Date(row.createdAt).toLocaleDateString("vi-VN")}
                </span>
              ),
            },
            {
              key: "items",
              title: "Items",
              render: (row) => (
                <span className="text-xs text-slate-600">
                  {row.items.length} item{row.items.length !== 1 ? "s" : ""}
                </span>
              ),
            },
            {
              key: "total",
              title: "Total",
              render: (row) => (
                <span className="text-sm font-semibold text-slate-800">
                  {Number(row.total).toLocaleString()} ₫
                </span>
              ),
            },
            {
              key: "orderStatus",
              title: "Order Status",
              render: (row) => (
                <StatusBadge
                  status={orderStatusLabel(row.orderStatus)}
                  showDot
                />
              ),
            },
            {
              key: "paymentStatus",
              title: "Payment",
              render: (row) => (
                <StatusBadge
                  status={paymentStatusLabel(row.paymentStatus)}
                  showDot
                />
              ),
            },
            {
              key: "update",
              title: "Change Status",
              render: (row) => (
                <div className="flex items-center gap-1.5">
                  <select
                    title="Change order status"
                    aria-label="Change order status"
                    value={pendingStatus[row.id] ?? row.orderStatus}
                    onChange={(e) =>
                      setPendingStatus((prev) => ({
                        ...prev,
                        [row.id]: e.target.value as AdminOrderStatus,
                      }))
                    }
                    className="rounded-lg border border-slate-200 px-2 py-1 text-xs text-slate-700 outline-none focus:border-emerald-400"
                  >
                    {statusOptions.map((s) => (
                      <option key={s} value={s}>
                        {orderStatusLabel(s)}
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={() => void handleUpdateStatus(row.id)}
                    disabled={
                      updatingOrderId === row.id ||
                      !pendingStatus[row.id] ||
                      pendingStatus[row.id] === row.orderStatus
                    }
                    className="rounded-lg bg-emerald-600 px-2.5 py-1 text-xs font-semibold text-white transition hover:bg-emerald-700 disabled:opacity-40"
                  >
                    {updatingOrderId === row.id ? "…" : "Save"}
                  </button>
                </div>
              ),
            },
            {
              key: "actions",
              title: "",
              render: (row) => (
                <button
                  type="button"
                  onClick={() => openDetail(row)}
                  className="rounded-lg border border-slate-200 px-2.5 py-1 text-xs font-medium text-slate-600 transition hover:bg-slate-50"
                >
                  Details
                </button>
              ),
            },
          ]}
          rows={orders}
          rowKey={(row) => row.id}
          emptyText="No orders found"
        />
      )}

      {/* Pagination */}
      {!loading && totalPages > 1 && (
        <div className="flex items-center justify-center gap-1.5">
          <button
            type="button"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page <= 1}
            className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm disabled:opacity-40"
          >
            ←
          </button>
          <span className="text-sm text-slate-500">
            Page {page} of {totalPages}
          </span>
          <button
            type="button"
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page >= totalPages}
            className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm disabled:opacity-40"
          >
            →
          </button>
        </div>
      )}

      {/* Order Detail Drawer */}
      <Drawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        title="Order Details"
        subtitle={selectedOrder ? `#${selectedOrder.id.slice(-10).toUpperCase()}` : ""}
        width="max-w-[480px]"
      >
        {selectedOrder && (
          <div className="space-y-6 text-sm text-slate-700">
            {/* Status Timeline */}
            {orderStatusLabel(selectedOrder.orderStatus) !== "Cancelled" ? (
              <div>
                <p className="mb-3 text-xs font-bold uppercase tracking-wider text-slate-400">
                  Status Timeline
                </p>
                <OrderTimeline
                  steps={ORDER_STEPS}
                  currentIndex={getStepIndex(selectedOrder.orderStatus)}
                />
              </div>
            ) : (
              <div className="rounded-xl border border-rose-100 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                🚫 This order was cancelled
              </div>
            )}

            {/* Order Info */}
            <div className="space-y-2 rounded-xl border border-slate-100 bg-slate-50 p-4">
              <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Order Info
              </p>
              <div className="grid grid-cols-2 gap-y-2 text-xs">
                <span className="text-slate-500">Order ID</span>
                <span className="font-mono font-semibold text-slate-800">
                  #{selectedOrder.id.slice(-10).toUpperCase()}
                </span>
                <span className="text-slate-500">Date</span>
                <span className="text-slate-700">
                  {new Date(selectedOrder.createdAt).toLocaleString("vi-VN")}
                </span>
                <span className="text-slate-500">Order Status</span>
                <StatusBadge status={orderStatusLabel(selectedOrder.orderStatus)} showDot />
                <span className="text-slate-500">Payment</span>
                <StatusBadge status={paymentStatusLabel(selectedOrder.paymentStatus)} showDot />
                <span className="text-slate-500">User ID</span>
                <span className="truncate font-mono text-slate-600">
                  {selectedOrder.userId}
                </span>
              </div>
            </div>

            {/* Shipping */}
            <div className="rounded-xl border border-slate-100 p-4">
              <p className="mb-2 text-xs font-bold uppercase tracking-wider text-slate-400">
                Shipping Address
              </p>
              <p className="text-sm text-slate-700">
                {selectedOrder.shippingAddress}
              </p>
            </div>

            {/* Items */}
            <div>
              <p className="mb-2 text-xs font-bold uppercase tracking-wider text-slate-400">
                Items ({selectedOrder.items.length})
              </p>
              <ul className="divide-y divide-slate-100 rounded-xl border border-slate-100">
                {selectedOrder.items.map((item) => (
                  <li
                    key={`${item.plantId}-${item.name}`}
                    className="flex items-center justify-between px-4 py-3"
                  >
                    <div>
                      <p className="text-sm font-medium text-slate-800">
                        {item.name}
                      </p>
                      <p className="text-xs text-slate-400">
                        {item.price.toLocaleString()} ₫ × {item.quantity}
                      </p>
                    </div>
                    <p className="text-sm font-bold text-slate-900">
                      {(item.price * item.quantity).toLocaleString()} ₫
                    </p>
                  </li>
                ))}
              </ul>
            </div>

            {/* Total */}
            <div className="flex items-center justify-between rounded-xl border border-emerald-100 bg-emerald-50 px-4 py-3">
              <span className="text-sm font-semibold text-slate-700">Total</span>
              <span className="text-lg font-bold text-emerald-700">
                {Number(selectedOrder.total).toLocaleString()} ₫
              </span>
            </div>

            {/* Quick status update from drawer */}
            <div className="space-y-2">
              <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Update Status
              </p>
              <div className="flex gap-2">
                <select
                  title="Update order status"
                  aria-label="Update order status"
                  value={pendingStatus[selectedOrder.id] ?? selectedOrder.orderStatus}
                  onChange={(e) =>
                    setPendingStatus((prev) => ({
                      ...prev,
                      [selectedOrder.id]: e.target.value as AdminOrderStatus,
                    }))
                  }
                  className="flex-1 rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-emerald-400"
                >
                  {statusOptions.map((s) => (
                    <option key={s} value={s}>
                      {orderStatusLabel(s)}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={() => void handleUpdateStatus(selectedOrder.id)}
                  disabled={
                    updatingOrderId === selectedOrder.id ||
                    !pendingStatus[selectedOrder.id] ||
                    pendingStatus[selectedOrder.id] === selectedOrder.orderStatus
                  }
                  className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:opacity-40"
                >
                  {updatingOrderId === selectedOrder.id ? "Saving…" : "Save"}
                </button>
              </div>
            </div>
          </div>
        )}
      </Drawer>

      {toast && (
        <AdminToast
          type={toast.type}
          message={toast.message}
          onClose={() => setToast(null)}
        />
      )}
    </section>
  );
}
