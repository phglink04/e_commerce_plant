"use client";

import { useState, useEffect } from "react";
import { Tag, X, Loader2, CheckCircle2, ChevronDown, Ticket } from "lucide-react";
import type { PaymentMethod } from "./types";
import { discountService } from "@/services/admin/discount.service";
import type { Discount } from "@/types/discount";

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
  const [vouchers, setVouchers] = useState<Discount[]>([]);
  const [showVoucherList, setShowVoucherList] = useState(false);
  const [loadingVouchers, setLoadingVouchers] = useState(false);

  // Fetch visible vouchers on mount
  useEffect(() => {
    const fetchVouchers = async () => {
      try {
        setLoadingVouchers(true);
        const list = await discountService.getVisibleDiscounts();
        setVouchers(list);
      } catch {
        // Silently fail — user can still type manually
      } finally {
        setLoadingVouchers(false);
      }
    };
    void fetchVouchers();
  }, []);

  const handleApply = async () => {
    if (!couponCode.trim()) {
      setLocalError("Vui lòng nhập mã giảm giá");
      return;
    }
    setLocalError("");
    const result = await onApplyDiscount(couponCode.trim());
    if (result) {
      setCouponCode("");
      setShowVoucherList(false);
    }
  };

  const handleSelectVoucher = async (code: string) => {
    setLocalError("");
    setCouponCode(code);
    setShowVoucherList(false);
    const result = await onApplyDiscount(code);
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
      <h2 className="text-lg font-semibold text-slate-900">Tóm tắt đơn hàng</h2>

      <div className="mt-4 space-y-2 text-sm">
        <div className="flex items-center justify-between text-slate-600">
          <span>Sản phẩm đã chọn</span>
          <strong className="text-slate-900">{selectedCount}</strong>
        </div>
        <div className="flex items-center justify-between text-slate-600">
          <span>Tạm tính</span>
          <strong className="text-slate-900">
            {subtotal.toLocaleString("vi-VN")}₫
          </strong>
        </div>
        <div className="flex items-center justify-between text-slate-600">
          <span>Phí vận chuyển</span>
          <strong className="text-slate-900">
            {shippingFee.toLocaleString("vi-VN")}₫
          </strong>
        </div>

        {/* Applied Discount */}
        {appliedDiscount && (
          <div className="flex items-center justify-between text-emerald-600">
            <span className="flex items-center gap-1">
              <Tag size={12} />
              Giảm giá ({appliedDiscount.code})
            </span>
            <strong>-{discountAmount.toLocaleString("vi-VN")}₫</strong>
          </div>
        )}
      </div>

      <div className="my-4 border-t border-dashed border-slate-200" />

      <div className="flex items-center justify-between text-base font-semibold text-slate-900">
        <span>Tổng cộng</span>
        <span>{displayTotal.toLocaleString("vi-VN")}₫</span>
      </div>

      {/* Coupon Code Section */}
      <section className="mt-5">
        <h3 className="mb-2 text-sm font-semibold text-slate-800">
          Mã giảm giá
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
              title="Bỏ mã"
            >
              <X size={16} />
            </button>
          </div>
        ) : (
          <div className="space-y-2">
            {/* Input + Apply */}
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
                placeholder="Nhập mã giảm giá"
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
                Áp dụng
              </button>
            </div>

            {displayError && (
              <p className="text-xs text-rose-600">{displayError}</p>
            )}

            {/* Voucher picker */}
            {vouchers.length > 0 && (
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setShowVoucherList(!showVoucherList)}
                  className="w-full flex items-center justify-between rounded-xl border border-dashed border-violet-300 bg-violet-50/50 px-3 py-2 text-sm text-violet-700 transition hover:bg-violet-50"
                >
                  <span className="flex items-center gap-1.5">
                    <Ticket size={14} />
                    Chọn từ danh sách voucher ({vouchers.length})
                  </span>
                  <ChevronDown
                    size={14}
                    className={`transition-transform ${showVoucherList ? "rotate-180" : ""}`}
                  />
                </button>

                {showVoucherList && (
                  <div className="absolute z-20 mt-1 w-full max-h-60 overflow-y-auto rounded-xl border border-slate-200 bg-white shadow-xl">
                    {loadingVouchers ? (
                      <div className="flex items-center justify-center py-4">
                        <Loader2 size={16} className="animate-spin text-slate-400" />
                      </div>
                    ) : (
                      vouchers.map((v) => {
                        const isEligible = total >= v.minOrderValue;
                        return (
                          <button
                            key={v.id}
                            type="button"
                            disabled={!isEligible}
                            onClick={() => void handleSelectVoucher(v.code)}
                            className={`w-full text-left px-4 py-3 border-b border-slate-50 transition ${
                              isEligible
                                ? "hover:bg-emerald-50 cursor-pointer"
                                : "opacity-50 cursor-not-allowed bg-slate-50"
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <span className="inline-flex items-center rounded-lg bg-violet-100 px-2 py-0.5 text-xs font-bold text-violet-700">
                                  {v.code}
                                </span>
                                <span className="inline-flex items-center rounded-full bg-rose-50 px-2 py-0.5 text-xs font-bold text-rose-600">
                                  -{v.percentage}%
                                </span>
                              </div>
                            </div>
                            <p className="mt-1 text-xs text-slate-500">
                              Đơn tối thiểu: {v.minOrderValue.toLocaleString("vi-VN")}₫
                              {!isEligible && (
                                <span className="ml-1 text-rose-500">
                                  (chưa đạt)
                                </span>
                              )}
                            </p>
                          </button>
                        );
                      })
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </section>

      <section className="mt-5">
        <h3 className="mb-2 text-sm font-semibold text-slate-800">
          Phương thức thanh toán
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
            <span>Thanh toán khi nhận hàng</span>
          </label>

          <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm transition hover:border-slate-300">
            <input
              type="radio"
              name="payment-method"
              checked={paymentMethod === "qr"}
              onChange={() => onPaymentMethodChange("qr")}
              className="h-4 w-4 border-slate-300 text-emerald-600 focus:ring-emerald-500"
            />
            <span>Chuyển khoản QR</span>
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
          ? "Đang xử lý..."
          : paymentMethod === "qr"
            ? "Đặt hàng & Thanh toán QR"
            : "Đặt hàng"}
      </button>

      {checkoutDisabled ? (
        <p className="mt-2 text-xs text-rose-600">
          Vui lòng chọn ít nhất một sản phẩm và địa chỉ giao hàng.
        </p>
      ) : null}
    </aside>
  );
}
