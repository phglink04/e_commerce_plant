"use client";

import { Package, MapPin, CreditCard, Tag } from "lucide-react";

type OrderItem = {
  plantId: string;
  name: string;
  quantity: number;
  price: number;
};

type CheckoutOrderSummaryProps = {
  orderId: string;
  items: OrderItem[];
  total: number;
  shippingAddress: string;
  paymentMethod?: string | null;
  discount?: { code: string; amount: number } | null;
  status?: string;
};

export default function CheckoutOrderSummary({
  orderId,
  items,
  total,
  shippingAddress,
  paymentMethod,
  discount,
  status,
}: CheckoutOrderSummaryProps) {
  const subtotal = items.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0,
  );

  const paymentLabel =
    paymentMethod === "qr"
      ? "QR Bank Transfer"
      : paymentMethod === "cash"
        ? "Cash on Delivery"
        : "—";

  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
      {/* Header */}
      <div className="border-b border-slate-100 px-5 py-4">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-semibold text-slate-900">
            Order Summary
          </h3>
          {status && (
            <span
              className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                status === "Paid"
                  ? "bg-emerald-100 text-emerald-700"
                  : status === "Pending"
                    ? "bg-amber-100 text-amber-700"
                    : status === "Failed"
                      ? "bg-rose-100 text-rose-700"
                      : "bg-slate-100 text-slate-600"
              }`}
            >
              {status}
            </span>
          )}
        </div>
        <p className="mt-0.5 text-xs text-slate-500">
          Order #{orderId.slice(-8).toUpperCase()}
        </p>
      </div>

      {/* Items */}
      <div className="border-b border-slate-100 px-5 py-4">
        <div className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-slate-500">
          <Package size={12} />
          Items
        </div>
        <div className="space-y-2">
          {items.map((item) => (
            <div
              key={item.plantId}
              className="flex items-center justify-between text-sm"
            >
              <div className="min-w-0 flex-1">
                <span className="text-slate-700">{item.name}</span>
                <span className="ml-1 text-slate-400">×{item.quantity}</span>
              </div>
              <span className="flex-none font-medium text-slate-900">
                {(item.price * item.quantity).toLocaleString("vi-VN")} ₫
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Shipping */}
      <div className="border-b border-slate-100 px-5 py-4">
        <div className="mb-1 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-slate-500">
          <MapPin size={12} />
          Shipping address
        </div>
        <p className="text-sm text-slate-700">{shippingAddress}</p>
      </div>

      {/* Payment Method */}
      <div className="border-b border-slate-100 px-5 py-4">
        <div className="mb-1 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-slate-500">
          <CreditCard size={12} />
          Payment method
        </div>
        <p className="text-sm font-medium text-slate-700">{paymentLabel}</p>
      </div>

      {/* Totals */}
      <div className="px-5 py-4">
        <div className="space-y-1.5 text-sm">
          <div className="flex justify-between text-slate-600">
            <span>Subtotal</span>
            <span>{subtotal.toLocaleString("vi-VN")} ₫</span>
          </div>
          {discount && (
            <div className="flex justify-between text-emerald-600">
              <span className="flex items-center gap-1">
                <Tag size={12} />
                Discount ({discount.code})
              </span>
              <span>-{discount.amount.toLocaleString("vi-VN")} ₫</span>
            </div>
          )}
          <div className="flex justify-between text-slate-600">
            <span>Shipping</span>
            <span>30,000 ₫</span>
          </div>
        </div>
        <div className="mt-3 flex justify-between border-t border-dashed border-slate-200 pt-3 text-base font-bold text-slate-900">
          <span>Total</span>
          <span>{total.toLocaleString("vi-VN")} ₫</span>
        </div>
      </div>
    </div>
  );
}
