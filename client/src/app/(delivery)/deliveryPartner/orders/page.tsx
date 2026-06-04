"use client";

import { useEffect, useState } from "react";
import api from "@/lib/api";
import { orderStatusLabel } from "@/lib/order-status";
import { useAuthStore } from "@/store/auth-store";
import {
  Search,
  Truck,
  CheckCircle,
  AlertTriangle,
  MapPin,
  User,
  Phone,
  DollarSign,
  Calendar,
  ShoppingBag,
  Package,
  X,
  FileText
} from "lucide-react";

type OrderItem = {
  plantId: string;
  name: string;
  quantity: number;
  price: number;
};

type Order = {
  id: string;
  userId: string;
  orderStatus: string;
  paymentStatus: string;
  total: number;
  shippingAddress: string;
  shippingFee: number;
  paymentMethod: string | null;
  items: OrderItem[];
  deliveryPartnerId?: string | null;
  deliveryPartnerName?: string | null;
  returnReason?: string | null;
  createdAt: string;
};

export default function DeliveryPartnerOrdersPage() {
  const { token } = useAuthStore();
  const [orders, setOrders] = useState<Order[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<"all" | "shipping" | "delivered" | "returned">("all");

  // Return Modal states
  const [returnModalOpen, setReturnModalOpen] = useState(false);
  const [returnOrderId, setReturnOrderId] = useState<string | null>(null);
  const [quickReason, setQuickReason] = useState("Khách hàng từ chối nhận hàng");
  const [customReason, setCustomReason] = useState("");

  useEffect(() => {
    const fetchOrders = async () => {
      if (!token) return;
      setLoading(true);
      try {
        const response = await api.get("/api/orders", {
          headers: { Authorization: `Bearer ${token}` },
        });
        const fetchedOrders = (response.data?.data?.orders ?? []) as Order[];
        setOrders(fetchedOrders);
      } catch {
        setError("Không thể tải danh sách vận đơn. Vui lòng thử lại sau.");
      } finally {
        setLoading(false);
      }
    };

    void fetchOrders();
  }, [token]);

  const updateStatus = async (orderId: string, status: string, reason?: string) => {
    if (!token) {
      setError("Vui lòng đăng nhập để tiếp tục.");
      return;
    }

    setError("");
    setUpdatingId(orderId);

    try {
      const payload: Record<string, string> = { orderStatus: status };
      if (reason) {
        payload.returnReason = reason;
      }

      await api.patch(
        `/api/orders/${orderId}/status`,
        payload,
        { headers: { Authorization: `Bearer ${token}` } },
      );

      setOrders((prevOrders) =>
        prevOrders.map((order) =>
          order.id === orderId 
            ? { ...order, orderStatus: status, returnReason: reason ?? order.returnReason } 
            : order,
        ),
      );
    } catch {
      setError("Không thể cập nhật trạng thái vận đơn.");
    } finally {
      setUpdatingId(null);
    }
  };

  const handleOpenReturnModal = (orderId: string) => {
    setReturnOrderId(orderId);
    setQuickReason("Khách hàng từ chối nhận hàng");
    setCustomReason("");
    setReturnModalOpen(true);
  };

  const handleConfirmReturn = async () => {
    if (!returnOrderId) return;
    const finalReason = quickReason === "Khác" ? customReason.trim() : quickReason;
    if (!finalReason) {
      alert("Vui lòng cung cấp lý do hoàn trả.");
      return;
    }
    setReturnModalOpen(false);
    await updateStatus(returnOrderId, "returned", finalReason);
    setReturnOrderId(null);
  };

  // KPIs Calculations
  const totalCount = orders ? orders.length : 0;
  const shippingCount = orders ? orders.filter((o) => o && o.orderStatus === "shipped").length : 0;
  const deliveredCount = orders ? orders.filter((o) => o && o.orderStatus === "delivered").length : 0;
  const returnedCount = orders ? orders.filter((o) => o && o.orderStatus === "returned").length : 0;

  // Filter and Search
  const filteredOrders = (orders || []).filter((order) => {
    if (!order) return false;
    // Tab Filter
    if (activeTab === "shipping") {
      if (order.orderStatus !== "shipped") return false;
    } else if (activeTab === "delivered") {
      if (order.orderStatus !== "delivered") return false;
    } else if (activeTab === "returned") {
      if (order.orderStatus !== "returned") return false;
    }

    // Search Query Filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      const matchId = order.id ? order.id.toLowerCase().includes(query) : false;
      const matchAddress = order.shippingAddress ? order.shippingAddress.toLowerCase().includes(query) : false;
      return matchId || matchAddress;
    }

    return true;
  });

  return (
    <div className="space-y-6">
      {error ? (
        <div className="flex items-center gap-3 rounded-xl border border-red-100 bg-red-50 p-4 text-sm text-red-600 shadow-sm">
          <AlertTriangle size={18} />
          <p className="font-medium">{error}</p>
        </div>
      ) : null}

      {/* KPI Stats Grid */}
      <section className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {/* Total */}
        <div className="group relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-5 shadow-xs transition-all duration-300 hover:shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold text-slate-500">Tổng Số Vận Đơn</span>
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-50 text-slate-600 transition-colors group-hover:bg-slate-100">
              <Package size={20} />
            </span>
          </div>
          <div className="mt-4">
            <span className="text-2xl font-extrabold text-slate-800">{totalCount}</span>
            <span className="ml-2 text-xs font-semibold text-slate-500 bg-slate-50 px-2 py-0.5 rounded-full">Giao phó</span>
          </div>
        </div>

        {/* Shipping */}
        <div className="group relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-5 shadow-xs transition-all duration-300 hover:shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold text-slate-500">Đang Vận Chuyển</span>
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 text-amber-600 transition-colors group-hover:bg-amber-100">
              <Truck size={20} />
            </span>
          </div>
          <div className="mt-4">
            <span className="text-2xl font-extrabold text-amber-600">{shippingCount}</span>
            <span className="ml-2 text-xs font-semibold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">Đang đi giao</span>
          </div>
        </div>

        {/* Delivered */}
        <div className="group relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-5 shadow-xs transition-all duration-300 hover:shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold text-slate-500">Giao Thành Công</span>
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 transition-colors group-hover:bg-emerald-100">
              <CheckCircle size={20} />
            </span>
          </div>
          <div className="mt-4">
            <span className="text-2xl font-extrabold text-emerald-600">{deliveredCount}</span>
            <span className="ml-2 text-xs font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">Đã hoàn tất</span>
          </div>
        </div>

        {/* Returned */}
        <div className="group relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-5 shadow-xs transition-all duration-300 hover:shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold text-slate-500">Bị Hoàn Trả</span>
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-50 text-rose-600 transition-colors group-hover:bg-rose-100">
              <AlertTriangle size={20} />
            </span>
          </div>
          <div className="mt-4">
            <span className="text-2xl font-extrabold text-rose-600">{returnedCount}</span>
            <span className="ml-2 text-xs font-semibold text-rose-600 bg-rose-50 px-2 py-0.5 rounded-full">Trả lại kho</span>
          </div>
        </div>
      </section>

      {/* Filter and Search Section */}
      <section className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
        {/* Navigation Tabs */}
        <div className="flex flex-wrap gap-2 rounded-xl bg-slate-100 p-1">
          <button
            onClick={() => setActiveTab("all")}
            className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition-all ${
              activeTab === "all" ? "bg-white text-slate-800 shadow-sm" : "text-slate-500 hover:text-slate-700"
            }`}
          >
            Tất cả
            <span className={`rounded-full px-2 py-0.2 text-xs font-bold ${activeTab === "all" ? "bg-slate-100 text-slate-800" : "bg-slate-200/60 text-slate-600"}`}>
              {totalCount}
            </span>
          </button>
          <button
            onClick={() => setActiveTab("shipping")}
            className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition-all ${
              activeTab === "shipping" ? "bg-white text-slate-800 shadow-sm" : "text-slate-500 hover:text-slate-700"
            }`}
          >
            Đang giao
            <span className={`rounded-full px-2 py-0.2 text-xs font-bold ${activeTab === "shipping" ? "bg-amber-100 text-amber-800" : "bg-slate-200/60 text-slate-600"}`}>
              {shippingCount}
            </span>
          </button>
          <button
            onClick={() => setActiveTab("delivered")}
            className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition-all ${
              activeTab === "delivered" ? "bg-white text-slate-800 shadow-sm" : "text-slate-500 hover:text-slate-700"
            }`}
          >
            Đã giao
            <span className={`rounded-full px-2 py-0.2 text-xs font-bold ${activeTab === "delivered" ? "bg-emerald-100 text-emerald-800" : "bg-slate-200/60 text-slate-600"}`}>
              {deliveredCount}
            </span>
          </button>
          <button
            onClick={() => setActiveTab("returned")}
            className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition-all ${
              activeTab === "returned" ? "bg-white text-slate-800 shadow-sm" : "text-slate-500 hover:text-slate-700"
            }`}
          >
            Đã hoàn trả
            <span className={`rounded-full px-2 py-0.2 text-xs font-bold ${activeTab === "returned" ? "bg-rose-100 text-rose-800" : "bg-slate-200/60 text-slate-600"}`}>
              {returnedCount}
            </span>
          </button>
        </div>

        {/* Search Bar */}
        <div className="relative w-full max-w-sm">
          <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Tìm theo mã đơn, địa chỉ..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-4 text-sm outline-none transition-all placeholder:text-slate-400 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
          />
        </div>
      </section>

      {/* Loading state */}
      {loading ? (
        <div className="flex h-64 flex-col items-center justify-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-emerald-100 border-t-emerald-600"></div>
          <p className="text-sm font-medium text-slate-500">Đang tải thông tin vận đơn...</p>
        </div>
      ) : filteredOrders.length === 0 ? (
        <div className="flex h-72 flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-white p-8 text-center shadow-xs">
          <Truck size={42} className="text-slate-300" />
          <h3 className="mt-4 text-lg font-bold text-slate-700">Không tìm thấy vận đơn nào</h3>
          <p className="mt-1 text-sm text-slate-400">
            Không có đơn hàng nào khớp với bộ lọc hoặc từ khóa tìm kiếm của bạn.
          </p>
        </div>
      ) : (
        /* Shipment Cards Grid */
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          {filteredOrders.map((order, idx) => {
            let statusColor = "bg-slate-100 text-slate-700 border-slate-200";
            if (order.orderStatus === "shipped") {
              statusColor = "bg-amber-50 text-amber-700 border-amber-100";
            } else if (order.orderStatus === "delivered") {
              statusColor = "bg-emerald-50 text-emerald-700 border-emerald-100";
            } else if (order.orderStatus === "returned") {
              statusColor = "bg-rose-50 text-rose-700 border-rose-100";
            }

            return (
              <article
                key={order.id || idx}
                className="relative flex flex-col justify-between overflow-hidden rounded-2xl border border-slate-200 bg-white p-5 shadow-xs transition-all duration-300 hover:shadow-md"
              >
                <div>
                  {/* Card Header */}
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-100 bg-slate-50 px-2.5 py-0.5 text-xs font-semibold">
                        <span className="text-slate-400 font-normal">Mã đơn:</span>
                        <span className="text-slate-700 font-mono">#{order.id ? order.id.slice(-10).toUpperCase() : "N/A"}</span>
                      </span>
                      {order.createdAt ? (
                        <p className="mt-1.5 text-[10px] text-slate-400 flex items-center gap-1">
                          <Calendar size={12} />
                          Ngày tạo: {new Date(order.createdAt).toLocaleDateString("vi-VN", {
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                            hour: "2-digit",
                            minute: "2-digit"
                          })}
                        </p>
                      ) : null}
                    </div>

                    {/* Status Badge */}
                    <span className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold ${statusColor}`}>
                      {orderStatusLabel(order.orderStatus)}
                    </span>
                  </div>

                  {/* Customer Info and Address */}
                  {(() => {
                    const { name, phone, address } = (() => {
                      if (!order.shippingAddress) return { name: "Không rõ", phone: "Không rõ", address: "Không rõ" };
                      const parts = order.shippingAddress.split(",");
                      if (parts.length < 2) {
                        return { name: "Không rõ", phone: "Không rõ", address: order.shippingAddress };
                      }
                      const nameVal = parts[0].trim();
                      const phoneVal = parts[1].trim();
                      const addressVal = parts.slice(2).join(",").trim();
                      return { name: nameVal, phone: phoneVal, address: addressVal };
                    })();

                    return (
                      <div className="mt-5 space-y-3 rounded-xl bg-slate-50/50 p-4 border border-slate-100">
                        <div className="flex items-start gap-2.5 text-sm text-slate-600">
                          <User className="mt-0.5 text-slate-400 shrink-0" size={16} />
                          <div>
                            <span className="font-semibold text-slate-700">Người nhận</span>
                            <p className="text-xs text-slate-600 font-medium mt-0.5">{name}</p>
                          </div>
                        </div>

                        <div className="flex items-start gap-2.5 text-sm text-slate-600">
                          <Phone className="mt-0.5 text-slate-400 shrink-0" size={16} />
                          <div>
                            <span className="font-semibold text-slate-700">Số điện thoại</span>
                            <p className="text-xs text-slate-600 font-medium mt-0.5 font-mono select-all">{phone}</p>
                          </div>
                        </div>

                        <div className="flex items-start gap-2.5 text-sm text-slate-600">
                          <MapPin className="mt-0.5 text-slate-400 shrink-0" size={16} />
                          <div>
                            <span className="font-semibold text-slate-700">Địa chỉ giao hàng</span>
                            <p className="text-xs text-slate-500 leading-relaxed mt-0.5">{address}</p>
                          </div>
                        </div>
                      </div>
                    );
                  })()}

                  {/* Items List */}
                  <div className="mt-4 border-t border-slate-100 pt-4">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-slate-500 mb-2">
                      <ShoppingBag size={14} />
                      Danh sách sản phẩm ({order.items ? order.items.reduce((acc, curr) => acc + (curr?.quantity || 0), 0) : 0})
                    </div>
                    <ul className="space-y-1.5 pl-1.5 max-h-24 overflow-y-auto scrollbar-thin">
                      {(order.items || []).map((item, index) => (
                        <li key={index} className="text-xs text-slate-600 flex items-center justify-between">
                          <span className="truncate max-w-[250px]">🌿 {item?.name || "Sản phẩm"}</span>
                          <span className="font-semibold shrink-0 text-slate-500 bg-slate-100 px-1.5 py-0.2 rounded-sm ml-2">
                            x{item?.quantity || 0}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Shipping Fee, Total and Payment Status */}
                  <div className="mt-4 flex flex-wrap items-center justify-between border-t border-slate-100 pt-4 gap-2">
                    <div className="flex items-center gap-1.5 text-xs text-slate-500">
                      <DollarSign size={14} />
                      Phí ship: <span className="font-semibold text-slate-700">{order.shippingFee?.toLocaleString("vi-VN")}đ</span>
                    </div>

                    <div className="text-right">
                      <span className="text-xs text-slate-400">Thu hộ (COD):</span>
                      <p className="text-base font-extrabold text-emerald-600">{order.total?.toLocaleString("vi-VN")}đ</p>
                      <span className={`inline-block rounded-sm px-1.5 py-0.2 text-[10px] font-bold mt-0.5 uppercase ${
                        order.paymentStatus === "paid" ? "bg-emerald-50 text-emerald-600 border border-emerald-100" : "bg-rose-50 text-rose-600 border border-rose-100"
                      }`}>
                        {order.paymentStatus === "paid" ? "Đã Thanh Toán" : "Chưa Thanh Toán"}
                      </span>
                    </div>
                  </div>

                  {/* Return Reason display */}
                  {order.orderStatus === "returned" && order.returnReason && (
                    <div className="mt-4 rounded-xl border border-rose-100 bg-rose-50/50 p-3.5 text-xs text-rose-700 flex items-start gap-2">
                      <FileText size={16} className="shrink-0 mt-0.5" />
                      <div>
                        <span className="font-bold">Lý do hoàn trả:</span>
                        <p className="mt-0.5 leading-relaxed font-medium">{order.returnReason}</p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Quick actions for delivery partner */}
                <div className="mt-5 border-t border-slate-100 pt-4">
                  {updatingId === order.id ? (
                    <div className="flex items-center justify-center py-2.5">
                      <span className="h-5 w-5 animate-spin rounded-full border-2 border-slate-300 border-t-slate-600"></span>
                      <span className="ml-2 text-xs font-semibold text-slate-500">Đang lưu trạng thái...</span>
                    </div>
                  ) : order.orderStatus === "shipped" ? (
                    <div className="flex gap-3">
                      <button
                        onClick={() => void updateStatus(order.id, "delivered")}
                        className="flex-1 flex items-center justify-center gap-1.5 rounded-xl bg-emerald-600 py-3 text-sm font-semibold text-white shadow-xs hover:bg-emerald-700 active:scale-98 transition-all"
                      >
                        <CheckCircle size={16} />
                        Giao thành công
                      </button>
                      <button
                        onClick={() => handleOpenReturnModal(order.id)}
                        className="rounded-xl border border-rose-200 bg-rose-50/50 px-3.5 py-3 text-sm font-semibold text-rose-600 hover:bg-rose-50 hover:border-rose-300 active:scale-98 transition-all"
                        title="Báo lỗi giao hàng / Trả hàng"
                      >
                        Trả hàng
                      </button>
                    </div>
                  ) : order.orderStatus === "delivered" ? (
                    <div className="flex items-center justify-center gap-2 rounded-xl bg-emerald-50 py-3 text-sm font-semibold text-emerald-700 border border-emerald-100">
                      <CheckCircle size={16} />
                      Đã hoàn tất giao hàng thành công
                    </div>
                  ) : (
                    <div className="flex items-center justify-center gap-2 rounded-xl bg-rose-50 py-3 text-sm font-semibold text-rose-700 border border-rose-100">
                      <AlertTriangle size={16} />
                      Đơn hàng đã được trả lại kho
                    </div>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      )}

      {/* Return Reason Modal */}
      {returnModalOpen && returnOrderId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-xl animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
              <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <span className="text-rose-500">⚠️</span> Yêu cầu hoàn trả vận đơn
              </h3>
              <button
                onClick={() => {
                  setReturnModalOpen(false);
                  setReturnOrderId(null);
                }}
                className="text-slate-400 hover:text-slate-600 transition"
              >
                <X size={20} />
              </button>
            </div>
            
            <p className="text-sm text-slate-500 mb-4 leading-relaxed">
              Vui lòng chọn hoặc điền lý do chi tiết để trả lại hàng về kho. Thông tin này sẽ được đồng bộ hiển thị lên bảng điều khiển của Admin.
            </p>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">Lý do phổ biến</label>
                <select
                  value={quickReason}
                  onChange={(e) => setQuickReason(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm outline-none focus:border-rose-400 focus:ring-1 focus:ring-rose-400 bg-white"
                >
                  <option value="Khách hàng từ chối nhận hàng">Khách hàng từ chối nhận hàng</option>
                  <option value="Không liên lạc được với người nhận">Không liên lạc được với người nhận</option>
                  <option value="Sai địa chỉ giao hàng">Sai địa chỉ giao hàng</option>
                  <option value="Khác">Lý do khác...</option>
                </select>
              </div>

              {quickReason === "Khác" && (
                <div className="animate-in slide-in-from-top-2 duration-200">
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">Chi tiết lý do khác</label>
                  <textarea
                    placeholder="Nhập lý do hoàn trả cụ thể..."
                    value={customReason}
                    onChange={(e) => setCustomReason(e.target.value)}
                    rows={3}
                    className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm outline-none focus:border-rose-400 focus:ring-1 focus:ring-rose-400"
                  />
                </div>
              )}
            </div>

            <div className="mt-6 flex justify-end gap-3 border-t border-slate-100 pt-4">
              <button
                type="button"
                onClick={() => {
                  setReturnModalOpen(false);
                  setReturnOrderId(null);
                }}
                className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50 transition"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={handleConfirmReturn}
                className="rounded-xl bg-rose-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-rose-700 transition"
              >
                Xác nhận hoàn trả
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
