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
  getUsers,
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
  { label: "Chờ xác nhận", description: "Đơn hàng được nhận" },
  { label: "Đã xác nhận", description: "Thanh toán được xác nhận" },
  { label: "Đang chuẩn bị", description: "Đang được chuẩn bị" },
  { label: "Đã gửi", description: "Đang trên đường" },
  { label: "Đã nhận", description: "Đã giao cho khách hàng" },
];

const STATUS_ORDER = ["Chờ xác nhận", "Đã xác nhận", "Đang chuẩn bị", "Đã gửi", "Đã nhận"];

function getStepIndex(status: string): number {
  const label = orderStatusLabel(status);
  return STATUS_ORDER.indexOf(label);
}

const STATUS_LEVEL: Record<string, number> = {
  pending: 0,
  confirmed: 1,
  processing: 2,
  shipped: 3,
  delivered: 4,
  returned: 4,
  cancelled: 4,
};

const getAvailableStatuses = (currentStatus: string) => {
  const currentLevel = STATUS_LEVEL[currentStatus] ?? 0;
  if (currentLevel === 4) {
    return ORDER_STATUS_OPTIONS.filter((o) => o.value === currentStatus);
  }
  return ORDER_STATUS_OPTIONS.filter((o) => {
    const level = STATUS_LEVEL[o.value] ?? 0;
    return level >= currentLevel;
  });
};

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
  const [selectedPartner, setSelectedPartner] = useState<Record<string, string>>({});
  const [deliveryPartners, setDeliveryPartners] = useState<{ id: string; name: string }[]>([]);
  const [toast, setToast] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  useEffect(() => {
    const fetchCarriers = async () => {
      if (!token) return;
      try {
        const response = await getUsers({ role: "deliverypartner", limit: 100 }, token);
        setDeliveryPartners(response.items.map((u) => ({ id: u.id, name: u.name })));
      } catch (err) {
        console.error("Error loading delivery partners:", err);
      }
    };
    void fetchCarriers();
  }, [token]);

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
    { value: "all" as const, label: "Tất cả", count: totalResults },
    ...ORDER_STATUS_OPTIONS.map((s) => ({
      value: s.value as StatusFilter,
      label: s.label,
    })),
  ];

  const handleUpdateStatus = async (orderId: string) => {
    if (!token) return;
    const newStatus = pendingStatus[orderId];
    if (!newStatus) return;

    let partnerId: string | undefined;
    let partnerName: string | undefined;

    if (newStatus === "shipped") {
      partnerId = selectedPartner[orderId];
      if (!partnerId) {
        setToast({ type: "error", message: "Vui lòng chọn đơn vị vận chuyển." });
        return;
      }
      const partner = deliveryPartners.find((dp) => dp.id === partnerId);
      partnerName = partner?.name;
    }

    try {
      setUpdatingOrderId(orderId);
      // Auto-update payment status to "paid" when order is delivered
      let paymentStatus: string | undefined;
      if (newStatus === "delivered") {
        paymentStatus = "paid";
      }
      await updateOrderStatus(
        orderId,
        newStatus,
        paymentStatus,
        token,
        partnerId,
        partnerName
      );
      setToast({ type: "success", message: "Trạng thái đơn hàng được cập nhật." });
      setOrders((prev) =>
        prev.map((o) => {
          if (o.id === orderId) {
            return {
              ...o,
              orderStatus: newStatus,
              paymentStatus: paymentStatus || o.paymentStatus,
              deliveryPartnerId: partnerId || o.deliveryPartnerId,
              deliveryPartnerName: partnerName || o.deliveryPartnerName,
            };
          }
          return o;
        }),
      );
      // update drawer if open
      if (selectedOrder?.id === orderId) {
        setSelectedOrder((prev) =>
          prev
            ? {
                ...prev,
                orderStatus: newStatus,
                paymentStatus: paymentStatus || prev.paymentStatus,
                deliveryPartnerId: partnerId || prev.deliveryPartnerId,
                deliveryPartnerName: partnerName || prev.deliveryPartnerName,
              }
            : prev,
        );
      }
    } catch (error) {
      setToast({
        type: "error",
        message: error instanceof Error ? error.message : "Không thể cập nhật trạng thái.",
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
          <h2 className="text-2xl font-bold tracking-tight text-slate-900">Đơn hàng</h2>
          <p className="mt-0.5 text-sm text-slate-500">
            {totalResults.toLocaleString()} tổng đơn hàng
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
            placeholder="Tìm kiếm theo mã đơn hàng, khách hàng, địa chỉ…"
            className="w-full rounded-xl border border-slate-200 bg-white py-2 pl-9 pr-3 text-sm outline-none transition focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100"
          />
        </div>
        {loading && (
          <span className="inline-flex items-center gap-1.5 text-xs text-slate-400">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" />
            Đang tải…
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
              title: "Mã đơn hàng",
              render: (row) => (
                <div className="flex flex-col gap-1">
                  <span className="font-mono text-xs text-slate-500">
                    #{row.id.slice(-10).toUpperCase()}
                  </span>
                  {row.deliveryPartnerName && (
                    <span className="inline-flex items-center gap-1 text-[10px] text-slate-400 font-semibold">
                      🚚 {row.deliveryPartnerName}
                    </span>
                  )}
                  {row.returnReason && (
                    <span className="inline-flex items-center gap-1 text-[10px] text-red-500 font-medium max-w-[150px] truncate" title={row.returnReason}>
                      ⚠️ {row.returnReason}
                    </span>
                  )}
                </div>
              ),
            },
            {
              key: "date",
              title: "Ngày",
              render: (row) => (
                <span className="text-xs text-slate-500">
                  {new Date(row.createdAt).toLocaleDateString("vi-VN")}
                </span>
              ),
            },
            {
              key: "items",
              title: "Sản phẩm",
              render: (row) => (
                <span className="text-xs text-slate-600">
                  {row.items.length} sản phẩm
                </span>
              ),
            },
            {
              key: "total",
              title: "Tổng tiền",
              render: (row) => (
                <span className="text-sm font-semibold text-slate-800">
                  {Number(row.total).toLocaleString()} ₫
                </span>
              ),
            },
            {
              key: "orderStatus",
              title: "Trạng thái đơn",
              render: (row) => (
                <StatusBadge
                  status={orderStatusLabel(row.orderStatus)}
                  showDot
                />
              ),
            },
            {
              key: "paymentStatus",
              title: "Thanh toán",
              render: (row) => (
                <StatusBadge
                  status={paymentStatusLabel(row.paymentStatus)}
                  showDot
                />
              ),
            },
            {
              key: "update",
              title: "Cập nhật",
              render: (row) => {
                const isTerminal = STATUS_LEVEL[row.orderStatus] === 4;
                return (
                  <div className="flex flex-col gap-1.5">
                    <div className="flex items-center gap-1.5">
                      <select
                        title="Thay đổi trạng thái đơn hàng"
                        aria-label="Thay đổi trạng thái đơn hàng"
                        value={pendingStatus[row.id] ?? row.orderStatus}
                        disabled={isTerminal}
                        onChange={(e) =>
                          setPendingStatus((prev) => ({
                            ...prev,
                            [row.id]: e.target.value as AdminOrderStatus,
                          }))
                        }
                        className="rounded-lg border border-slate-200 px-2 py-1 text-xs text-slate-700 outline-none focus:border-emerald-400 disabled:bg-slate-50 disabled:text-slate-400"
                      >
                        {getAvailableStatuses(row.orderStatus).map((s) => (
                          <option key={s.value} value={s.value}>
                            {s.label}
                          </option>
                        ))}
                      </select>
                      <button
                        type="button"
                        onClick={() => void handleUpdateStatus(row.id)}
                        disabled={
                          isTerminal ||
                          updatingOrderId === row.id ||
                          !pendingStatus[row.id] ||
                          pendingStatus[row.id] === row.orderStatus ||
                          (pendingStatus[row.id] === "shipped" && !selectedPartner[row.id])
                        }
                        className="rounded-lg bg-emerald-600 px-2.5 py-1 text-xs font-semibold text-white transition hover:bg-emerald-700 disabled:opacity-40"
                      >
                        {updatingOrderId === row.id ? "…" : "Lưu"}
                      </button>
                    </div>
                    {pendingStatus[row.id] === "shipped" && (
                      <select
                        title="Chọn bưu tá vận chuyển"
                        aria-label="Chọn bưu tá vận chuyển"
                        value={selectedPartner[row.id] ?? ""}
                        onChange={(e) =>
                          setSelectedPartner((prev) => ({
                            ...prev,
                            [row.id]: e.target.value,
                          }))
                        }
                        className="rounded-lg border border-slate-200 px-2 py-1 text-xs text-slate-700 outline-none focus:border-emerald-400"
                      >
                        <option value="">-- Chọn Bưu Tá --</option>
                        {deliveryPartners.map((dp) => (
                          <option key={dp.id} value={dp.id}>
                            {dp.name}
                          </option>
                        ))}
                      </select>
                    )}
                  </div>
                );
              },
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
                  Chi tiết
                </button>
              ),
            },
          ]}
          rows={orders}
          rowKey={(row) => row.id}
          emptyText="Không có đơn hàng nào"
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
            Trang {page} của {totalPages}
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
        title="Chi tiết đơn hàng"
        subtitle={selectedOrder ? `#${selectedOrder.id.slice(-10).toUpperCase()}` : ""}
        width="max-w-[480px]"
      >
        {selectedOrder && (
          <div className="space-y-6 text-sm text-slate-700">
            {/* Status Timeline */}
            {orderStatusLabel(selectedOrder.orderStatus) !== "Đã hủy" ? (
              <div>
                <p className="mb-3 text-xs font-bold uppercase tracking-wider text-slate-400">
                  Tiến trình trạng thái
                </p>
                <OrderTimeline
                  steps={ORDER_STEPS}
                  currentIndex={getStepIndex(selectedOrder.orderStatus)}
                />
              </div>
            ) : (
              <div className="rounded-xl border border-rose-100 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                🚫 Đơn hàng này đã bị hủy
              </div>
            )}

            {/* Order Info */}
            <div className="space-y-2 rounded-xl border border-slate-100 bg-slate-50 p-4">
              <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Thông tin đơn hàng
              </p>
              <div className="grid grid-cols-2 gap-y-2 text-xs">
                <span className="text-slate-500">Mã đơn hàng</span>
                <span className="font-mono font-semibold text-slate-800">
                  #{selectedOrder.id.slice(-10).toUpperCase()}
                </span>
                <span className="text-slate-500">Ngày</span>
                <span className="text-slate-700">
                  {new Date(selectedOrder.createdAt).toLocaleString("vi-VN")}
                </span>
                <span className="text-slate-500">Trạng thái đơn</span>
                <StatusBadge status={orderStatusLabel(selectedOrder.orderStatus)} showDot />
                <span className="text-slate-500">Thanh toán</span>
                <StatusBadge status={paymentStatusLabel(selectedOrder.paymentStatus)} showDot />
              </div>
            </div>

            {/* Shipping Info */}
            {(() => {
              const { name, phone, address } = (() => {
                if (!selectedOrder.shippingAddress) return { name: "Không rõ", phone: "Không rõ", address: "Không rõ" };
                const parts = selectedOrder.shippingAddress.split(",");
                if (parts.length < 2) {
                  return { name: "Không rõ", phone: "Không rõ", address: selectedOrder.shippingAddress };
                }
                const nameVal = parts[0].trim();
                const phoneVal = parts[1].trim();
                const addressVal = parts.slice(2).join(",").trim();
                return { name: nameVal, phone: phoneVal, address: addressVal };
              })();

              return (
                <div className="rounded-xl border border-slate-100 p-4 space-y-3">
                  <p className="mb-1 text-xs font-bold uppercase tracking-wider text-slate-400">
                    Thông tin nhận hàng
                  </p>
                  <div className="grid grid-cols-[100px_1fr] gap-y-2 text-xs">
                    <span className="text-slate-500 font-medium">Người nhận</span>
                    <span className="font-semibold text-slate-700">{name}</span>

                    <span className="text-slate-500 font-medium">Số điện thoại</span>
                    <span className="font-mono font-semibold text-slate-700 select-all">{phone}</span>

                    <span className="text-slate-500 font-medium">Địa chỉ giao</span>
                    <span className="text-slate-600 leading-relaxed">{address}</span>
                  </div>
                </div>
              );
            })()}

            {/* Shipping Partner */}
            {selectedOrder.deliveryPartnerName && (
              <div className="rounded-xl border border-slate-100 bg-slate-50 p-4">
                <p className="mb-2 text-xs font-bold uppercase tracking-wider text-slate-400">
                  Thông tin vận chuyển
                </p>
                <div className="grid grid-cols-2 gap-y-2 text-xs">
                  <span className="text-slate-500">Đơn vị vận chuyển</span>
                  <span className="font-semibold text-slate-700">
                    🚚 {selectedOrder.deliveryPartnerName}
                  </span>
                  {selectedOrder.returnReason && (
                    <>
                      <span className="text-slate-500">Lý do hoàn trả</span>
                      <span className="font-semibold text-red-600">
                        ⚠️ {selectedOrder.returnReason}
                      </span>
                    </>
                  )}
                </div>
              </div>
            )}

            {/* Items */}
            <div>
              <p className="mb-2 text-xs font-bold uppercase tracking-wider text-slate-400">
                Sản phẩm ({selectedOrder.items.length})
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
              <span className="text-sm font-semibold text-slate-700">Tổng tiền</span>
              <span className="text-lg font-bold text-emerald-700">
                {Number(selectedOrder.total).toLocaleString()} ₫
              </span>
            </div>

            {/* Quick status update from drawer */}
            <div className="space-y-3">
              <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Cập nhật trạng thái
              </p>
              <div className="flex flex-col gap-3">
                <div className="flex gap-2">
                  <select
                    title="Cập nhật trạng thái đơn hàng"
                    aria-label="Cập nhật trạng thái đơn hàng"
                    value={pendingStatus[selectedOrder.id] ?? selectedOrder.orderStatus}
                    disabled={STATUS_LEVEL[selectedOrder.orderStatus] === 4}
                    onChange={(e) =>
                      setPendingStatus((prev) => ({
                        ...prev,
                        [selectedOrder.id]: e.target.value as AdminOrderStatus,
                      }))
                    }
                    className="flex-1 rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-emerald-400 disabled:bg-slate-50 disabled:text-slate-400"
                  >
                    {getAvailableStatuses(selectedOrder.orderStatus).map((s) => (
                      <option key={s.value} value={s.value}>
                        {s.label}
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={() => void handleUpdateStatus(selectedOrder.id)}
                    disabled={
                      STATUS_LEVEL[selectedOrder.orderStatus] === 4 ||
                      updatingOrderId === selectedOrder.id ||
                      !pendingStatus[selectedOrder.id] ||
                      pendingStatus[selectedOrder.id] === selectedOrder.orderStatus ||
                      (pendingStatus[selectedOrder.id] === "shipped" && !selectedPartner[selectedOrder.id])
                    }
                    className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:opacity-40"
                  >
                    {updatingOrderId === selectedOrder.id ? "Đang lưu…" : "Lưu"}
                  </button>
                </div>
                {pendingStatus[selectedOrder.id] === "shipped" && (
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-500">Bưu tá vận chuyển</label>
                    <select
                      title="Chọn bưu tá vận chuyển"
                      aria-label="Chọn bưu tá vận chuyển"
                      value={selectedPartner[selectedOrder.id] ?? ""}
                      onChange={(e) =>
                        setSelectedPartner((prev) => ({
                          ...prev,
                          [selectedOrder.id]: e.target.value,
                        }))
                      }
                      className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-emerald-400"
                    >
                      <option value="">-- Chọn Bưu Tá --</option>
                      {deliveryPartners.map((dp) => (
                        <option key={dp.id} value={dp.id}>
                          {dp.name}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
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
