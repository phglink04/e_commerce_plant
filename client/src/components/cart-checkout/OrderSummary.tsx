"use client";

import { useState } from "react";
import { Tag, X, Loader2, CheckCircle2 } from "lucide-react";
import type { PaymentMethod } from "./types";

type DiscountInfo = {
  code: string;
  discountAmount: number;
  finalTotal: number;
  message: string;
};

type OrderSummaryProps = {
  selectedCount: number;
  subtotal: number;
  shippingFee: number;
  total: number;
  paymentMethod: PaymentMethod;
  checkoutDisabled: boolean;
  processing: boolean;
  onPaymentMethodChange: (method: PaymentMethod) => void;
  onCheckout: () => void;
  // Discount props
  appliedDiscount: DiscountInfo | null;
  onApplyDiscount: (code: string) => Promise<DiscountInfo | null>;
  onRemoveDiscount: () => void;
  applyingDiscount?: boolean;
  discountError?: string;
};

export default function OrderSummary({
  selectedCount,
  subtotal,
  shippingFee,
  total,
  paymentMethod,
  checkoutDisabled,
  processing,
  onPaymentMethodChange,
  onCheckout,
  appliedDiscount,
  onApplyDiscount,
  onRemoveDiscount,
  applyingDiscount = false,
  discountError = "",
}: OrderSummaryProps) {
  const [couponCode, setCouponCode] = useState("");
  const [localError, setLocalError] = useState("");

  const handleApply = async () => {
    if (!couponCode.trim()) {
      setLocalError("Please enter a coupon code");
      return;
    }
    setLocalError("");
    const result = await onApplyDiscount(couponCode.trim());
    if (result) {
      setCouponCode("");
    }
  };

  const handleRemove = () => {
    setCouponCode("");
    setLocalError("");
    onRemoveDiscount();
  };

  const displayError = discountError || localError;

  // Calculate the displayed total
  const discountAmount = appliedDiscount?.discountAmount ?? 0;
  const displayTotal = total - discountAmount;

  return (
    <aside className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm lg:sticky lg:top-24">
      <h2 className="text-lg font-semibold text-slate-900">Checkout Summary</h2>

      <div className="mt-4 space-y-2 text-sm">
        <div className="flex items-center justify-between text-slate-600">
          <span>Selected items</span>
          <strong className="text-slate-900">{selectedCount}</strong>
        </div>
        <div className="flex items-center justify-between text-slate-600">
          <span>Subtotal</span>
          <strong className="text-slate-900">
            {subtotal.toLocaleString()} VND
          </strong>
        </div>
        <div className="flex items-center justify-between text-slate-600">
          <span>Shipping fee</span>
          <strong className="text-slate-900">
            {shippingFee.toLocaleString()} VND
          </strong>
        </div>

        {/* Applied Discount */}
        {appliedDiscount && (
          <div className="flex items-center justify-between text-emerald-600">
            <span className="flex items-center gap-1">
              <Tag size={12} />
              Discount ({appliedDiscount.code})
            </span>
            <strong>-{discountAmount.toLocaleString()} VND</strong>
          </div>
        )}
      </div>

      <div className="my-4 border-t border-dashed border-slate-200" />

      <div className="flex items-center justify-between text-base font-semibold text-slate-900">
        <span>Total</span>
        <span>{displayTotal.toLocaleString()} VND</span>
      </div>

      {/* Coupon Code Section */}
      <section className="mt-5">
        <h3 className="mb-2 text-sm font-semibold text-slate-800">
          Discount Code
        </h3>

        {appliedDiscount ? (
          <div className="flex items-center justify-between rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2.5">
            <div className="flex items-center gap-2">
              <CheckCircle2 size={16} className="text-emerald-600" />
              <div>
                <span className="text-sm font-bold text-emerald-700">
                  {appliedDiscount.code}
                </span>
                <p className="text-xs text-emerald-600">
                  {appliedDiscount.message}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={handleRemove}
              className="rounded-lg p-1 text-slate-400 transition hover:bg-red-50 hover:text-red-500"
              title="Remove coupon"
            >
              <X size={16} />
            </button>
          </div>
        ) : (
          <div>
            <div className="flex gap-2">
              <input
                type="text"
                value={couponCode}
                onChange={(e) => {
                  setCouponCode(e.target.value.toUpperCase());
                  setLocalError("");
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    void handleApply();
                  }
                }}
                placeholder="Enter coupon code"
                className="flex-1 rounded-xl border border-slate-200 px-3 py-2.5 text-sm uppercase tracking-wider text-slate-800 outline-none transition placeholder:normal-case placeholder:tracking-normal focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100"
              />
              <button
                type="button"
                onClick={() => void handleApply()}
                disabled={applyingDiscount || !couponCode.trim()}
                className="inline-flex items-center gap-1.5 rounded-xl bg-violet-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-violet-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {applyingDiscount ? (
                  <Loader2 size={14} className="animate-spin" />
                ) : (
                  <Tag size={14} />
                )}
                Apply
              </button>
            </div>

            {displayError && (
              <p className="mt-1.5 text-xs text-rose-600">{displayError}</p>
            )}
          </div>
        )}
      </section>

      <section className="mt-5">
        <h3 className="mb-2 text-sm font-semibold text-slate-800">
          Payment Method
        </h3>
        <div className="space-y-2">
          <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm transition hover:border-slate-300">
            <input
              type="radio"
              name="payment-method"
              checked={paymentMethod === "cash"}
              onChange={() => onPaymentMethodChange("cash")}
              className="h-4 w-4 border-slate-300 text-emerald-600 focus:ring-emerald-500"
            />
            <span>Cash on Delivery</span>
          </label>

          <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm transition hover:border-slate-300">
            <input
              type="radio"
              name="payment-method"
              checked={paymentMethod === "qr"}
              onChange={() => onPaymentMethodChange("qr")}
              className="h-4 w-4 border-slate-300 text-emerald-600 focus:ring-emerald-500"
            />
            <span>QR Bank Transfer</span>
          </label>
        </div>
      </section>

      <button
        type="button"
        onClick={onCheckout}
        disabled={checkoutDisabled || processing}
        className="mt-5 w-full rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {processing
          ? "Processing..."
          : paymentMethod === "qr"
            ? "Checkout & Show QR"
            : "Checkout"}
      </button>

      {checkoutDisabled ? (
        <p className="mt-2 text-xs text-rose-600">
          Select at least one item and one shipping address to continue.
        </p>
      ) : null}
    </aside>
  );
}
