"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Package,
  Clock,
  CreditCard,
  Truck,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  ChevronRight,
  Search,
  Filter,
} from "lucide-react";
import { useMyOrders } from "@/hooks/useProfile";
import type { Order, OrderStatus } from "@/types";

const STATUS_TABS: { label: string; value: string }[] = [
  { label: "All", value: "" },
  { label: "Pending", value: "pending" },
  { label: "Confirmed", value: "confirmed" },
  { label: "Processing", value: "processing" },
  { label: "Shipped", value: "shipped" },
  { label: "Delivered", value: "delivered" },
  { label: "Cancelled", value: "cancelled" },
];

const STATUS_CONFIG: Record<
  string,
  { icon: React.ElementType; color: string; bg: string }
> = {
  pending: { icon: Clock, color: "#d97706", bg: "#fef3c7" },
  confirmed: { icon: CheckCircle2, color: "#059669", bg: "#d1fae5" },
  processing: { icon: Package, color: "#7c3aed", bg: "#ede9fe" },
  shipped: { icon: Truck, color: "#0891b2", bg: "#cffafe" },
  delivered: { icon: CheckCircle2, color: "#16a34a", bg: "#dcfce7" },
  cancelled: { icon: XCircle, color: "#dc2626", bg: "#fee2e2" },
  returned: { icon: AlertTriangle, color: "#ea580c", bg: "#fff7ed" },
};

const PAYMENT_STATUS_CONFIG: Record<
  string,
  { label: string; color: string; bg: string }
> = {
  unpaid: { label: "Unpaid", color: "#d97706", bg: "#fef3c7" },
  paid: { label: "Paid", color: "#16a34a", bg: "#dcfce7" },
  failed: { label: "Failed", color: "#dc2626", bg: "#fee2e2" },
  refunded: { label: "Refunded", color: "#7c3aed", bg: "#ede9fe" },
};

const STATUS_LABEL: Record<string, string> = {
  pending: "Pending",
  confirmed: "Confirmed",
  processing: "Processing",
  shipped: "Shipped",
  delivered: "Delivered",
  cancelled: "Cancelled",
  returned: "Returned",
};

function OrderStatusBadge({ status }: { status: OrderStatus }) {
  const config = STATUS_CONFIG[status] || STATUS_CONFIG.pending;
  const Icon = config.icon;
  return (
    <span
      className="pf-order__status"
      style={{ color: config.color, background: config.bg }}
    >
      <Icon size={14} />
      {STATUS_LABEL[status] || status}
    </span>
  );
}

function PaymentBadge({ status }: { status: string }) {
  const config = PAYMENT_STATUS_CONFIG[status] || PAYMENT_STATUS_CONFIG.unpaid;
  return (
    <span
      className="pf-order__status"
      style={{ color: config.color, background: config.bg, fontSize: "0.7rem" }}
    >
      {config.label}
    </span>
  );
}

function OrderItem({ order }: { order: Order }) {
  const total = order.total || 0;
  const itemCount = order.items?.length || 0;
  const orderId = order.id || order._id;

  return (
    <Link
      href={`/profile/orders/${orderId}`}
      className="pf-order__card"
      id={`order-${orderId}`}
    >
      <div className="pf-order__card-top">
        <div className="pf-order__card-id">
          <Package size={16} />
          <span>#{orderId.slice(-8).toUpperCase()}</span>
        </div>
        <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
          <OrderStatusBadge status={order.orderStatus} />
          <PaymentBadge status={order.paymentStatus} />
        </div>
      </div>

      <div className="pf-order__card-body">
        <div className="pf-order__card-items">
          {order.items.slice(0, 3).map((item, i) => (
            <div key={i} className="pf-order__card-item">
              <span className="pf-order__card-item-name">{item.name}</span>
              <span className="pf-order__card-item-qty">×{item.quantity}</span>
            </div>
          ))}
          {itemCount > 3 && (
            <p className="pf-order__card-more">+{itemCount - 3} more items</p>
          )}
        </div>
      </div>

      <div className="pf-order__card-footer">
        <div className="pf-order__card-total">
          <span className="pf-order__card-total-label">Total</span>
          <span className="pf-order__card-total-value">
            {total.toLocaleString("vi-VN")}₫
          </span>
        </div>
        <div className="pf-order__card-date">
          {new Date(order.createdAt).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
          })}
        </div>
        <ChevronRight size={18} className="pf-order__card-arrow" />
      </div>
    </Link>
  );
}

export default function OrderList() {
  const [activeTab, setActiveTab] = useState("");
  const { orders, loading, error } = useMyOrders(activeTab || undefined);

  if (loading) {
    return (
      <div className="pf-skeleton-wrap">
        {[1, 2, 3].map((i) => (
          <div key={i} className="pf-skeleton pf-skeleton--card" />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="pf-empty">
        <AlertTriangle size={48} />
        <h3>Unable to load orders</h3>
        <p>{error.message}</p>
      </div>
    );
  }

  return (
    <div className="pf-orders" id="order-list">
      {/* Status Tabs */}
      <div className="pf-tabs">
        {STATUS_TABS.map((tab) => (
          <button
            key={tab.value}
            className={`pf-tabs__item ${activeTab === tab.value ? "pf-tabs__item--active" : ""}`}
            onClick={() => setActiveTab(tab.value)}
            id={`tab-${tab.value || "all"}`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Orders List */}
      {orders.length === 0 ? (
        <div className="pf-empty">
          <Package size={48} />
          <h3>No orders found</h3>
          <p>
            {activeTab
              ? `You don't have any ${activeTab} orders yet.`
              : "You haven't placed any orders yet."}
          </p>
          <Link href="/shop" className="pf-btn pf-btn--primary">
            Start Shopping
          </Link>
        </div>
      ) : (
        <div className="pf-orders__grid">
          {orders.map((order) => (
            <OrderItem key={order.id || order._id} order={order} />
          ))}
        </div>
      )}
    </div>
  );
}
