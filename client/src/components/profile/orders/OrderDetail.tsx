"use client";

import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Package,
  MapPin,
  CreditCard,
  Clock,
  CheckCircle2,
  XCircle,
  Truck,
  AlertTriangle,
  Loader2,
} from "lucide-react";
import { useOrderDetail } from "@/hooks/useProfile";
import type { OrderStatus } from "@/types";
import { useState } from "react";

const STATUS_STEPS: OrderStatus[] = [
  "pending",
  "confirmed",
  "processing",
  "shipped",
  "delivered",
];

const STATUS_STEP_LABELS: Record<string, string> = {
  pending: "Chờ xử lý",
  confirmed: "Đã xác nhận",
  processing: "Đang xử lý",
  shipped: "Đang giao",
  delivered: "Đã giao",
};

const PAYMENT_STATUS_LABELS: Record<string, string> = {
  unpaid: "Chưa thanh toán",
  paid: "Đã thanh toán",
  failed: "Thất bại",
  refunded: "Hoàn tiền",
};

interface OrderDetailProps {
  orderId: string;
}

export default function OrderDetail({ orderId }: OrderDetailProps) {
  const router = useRouter();
  const { order, loading, cancelling, cancelOrder } = useOrderDetail(orderId);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [toast, setToast] = useState("");

  const handleCancel = async () => {
    try {
      await cancelOrder();
      setToast("Đã hủy đơn hàng thành công");
      setShowCancelConfirm(false);
      setTimeout(() => setToast(""), 3000);
    } catch {
      setToast("Hủy đơn hàng thất bại");
    }
  };

  if (loading) {
    return (
      <div className="pf-skeleton-wrap">
        <div className="pf-skeleton pf-skeleton--card pf-skeleton--tall" />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="pf-empty">
        <Package size={48} />
        <h3>Không tìm thấy đơn hàng</h3>
        <button
          onClick={() => router.push("/profile/orders")}
          className="pf-btn pf-btn--primary"
        >
          Quay lại Đơn hàng
        </button>
      </div>
    );
  }

  const canCancel = ["pending", "confirmed"].includes(order.orderStatus);
  const isCancelled = order.orderStatus === "cancelled";
  const currentStepIndex = STATUS_STEPS.indexOf(order.orderStatus);

  return (
    <div className="pf-order-detail" id="order-detail">
      {toast && (
        <div className="pf-toast pf-toast--success" role="alert">
          <CheckCircle2 size={18} />
          <span>{toast}</span>
        </div>
      )}

      {/* Back Button */}
      <button
        onClick={() => router.push("/profile/orders")}
        className="pf-order-detail__back"
        id="back-to-orders"
      >
        <ArrowLeft size={18} />
        Quay lại Đơn hàng
      </button>

      {/* Order Header */}
      <div className="pf-order-detail__header">
        <div>
          <h2 className="pf-order-detail__id">
            Đơn hàng #{(order.id || order._id).slice(-8).toUpperCase()}
          </h2>
          <p className="pf-order-detail__date">
            Đặt ngày{" "}
            {new Date(order.createdAt).toLocaleDateString("vi-VN", {
              weekday: "long",
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </p>
        </div>
        <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
          <span
            className={`pf-order-detail__status pf-order-detail__status--${order.orderStatus}`}
          >
            {STATUS_STEP_LABELS[order.orderStatus] || order.orderStatus}
          </span>
          <span
            className={`pf-order-detail__status pf-order-detail__status--${order.paymentStatus}`}
          >
            {PAYMENT_STATUS_LABELS[order.paymentStatus] || order.paymentStatus}
          </span>
        </div>
      </div>

      {/* Progress Tracker (non-cancelled only) */}
      {!isCancelled && currentStepIndex >= 0 && (
        <div className="pf-order-detail__progress">
          {STATUS_STEPS.map((step, i) => {
            const isCompleted = i <= currentStepIndex;
            const isCurrent = i === currentStepIndex;
            return (
              <div
                key={step}
                className={`pf-progress-step ${isCompleted ? "pf-progress-step--done" : ""} ${isCurrent ? "pf-progress-step--current" : ""}`}
              >
                <div className="pf-progress-step__dot">
                  {isCompleted ? <CheckCircle2 size={16} /> : <span />}
                </div>
                <span className="pf-progress-step__label">
                  {STATUS_STEP_LABELS[step] || step}
                </span>
                {i < STATUS_STEPS.length - 1 && (
                  <div
                    className={`pf-progress-step__line ${isCompleted ? "pf-progress-step__line--done" : ""}`}
                  />
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Order Items */}
      <div className="pf-order-detail__section">
        <h3 className="pf-order-detail__section-title">
          <Package size={18} />
          Sản phẩm ({order.items.length})
        </h3>
        <div className="pf-order-detail__items">
          {order.items.map((item, i) => (
            <div key={i} className="pf-order-detail__item">
              <div className="pf-order-detail__item-info">
                <span className="pf-order-detail__item-name">{item.name}</span>
                <span className="pf-order-detail__item-qty">
                  SL: {item.quantity}
                </span>
              </div>
              <span className="pf-order-detail__item-price">
                {(item.price * item.quantity).toLocaleString("vi-VN")}₫
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Order Summary */}
      <div className="pf-order-detail__section">
        <h3 className="pf-order-detail__section-title">
          <CreditCard size={18} />
          Tóm tắt
        </h3>
        <div className="pf-order-detail__summary">
          {order.discount && (
            <div className="pf-order-detail__summary-row">
              <span>Giảm giá ({order.discount.code})</span>
              <span className="pf-text-green">
                −{order.discount.amount.toLocaleString("vi-VN")}₫
              </span>
            </div>
          )}
          {order.paymentMethod && (
            <div className="pf-order-detail__summary-row">
              <span>Phương thức thanh toán</span>
              <span>{order.paymentMethod}</span>
            </div>
          )}
          <div className="pf-order-detail__summary-row">
            <span>Trạng thái thanh toán</span>
            <span>{PAYMENT_STATUS_LABELS[order.paymentStatus] || order.paymentStatus}</span>
          </div>
          <div className="pf-order-detail__summary-row pf-order-detail__summary-row--total">
            <span>Tổng cộng</span>
            <span>{order.total.toLocaleString("vi-VN")}₫</span>
          </div>
        </div>
      </div>

      {/* Shipping Address */}
      <div className="pf-order-detail__section">
        <h3 className="pf-order-detail__section-title">
          <MapPin size={18} />
          Địa chỉ giao hàng
        </h3>
        <p className="pf-order-detail__address">{order.shippingAddress}</p>
      </div>

      {/* Notes */}
      {order.notes && (
        <div className="pf-order-detail__section">
          <h3 className="pf-order-detail__section-title">Ghi chú</h3>
          <p className="pf-order-detail__notes">{order.notes}</p>
        </div>
      )}

      {/* Cancel Button */}
      {canCancel && (
        <div className="pf-order-detail__actions">
          {showCancelConfirm ? (
            <div className="pf-order-detail__confirm">
              <p>Bạn có chắc muốn hủy đơn hàng này không?</p>
              <div className="pf-order-detail__confirm-actions">
                <button
                  onClick={handleCancel}
                  className="pf-btn pf-btn--danger"
                  disabled={cancelling}
                  id="confirm-cancel-order"
                >
                  {cancelling ? (
                    <>
                      <Loader2 size={16} className="pf-spin" />
                      Đang hủy…
                    </>
                  ) : (
                    "Đồng ý, Hủy Đơn"
                  )}
                </button>
                <button
                  onClick={() => setShowCancelConfirm(false)}
                  className="pf-btn pf-btn--ghost"
                >
                  Không, Giữ Đơn
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setShowCancelConfirm(true)}
              className="pf-btn pf-btn--danger-outline"
              id="cancel-order-btn"
            >
              <XCircle size={16} />
              Hủy Đơn Hàng
            </button>
          )}
        </div>
      )}
    </div>
  );
}
