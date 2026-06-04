"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { CheckCircle2, ShoppingBag, ClipboardList } from "lucide-react";
import api from "@/lib/api";
import { useAuthStore } from "@/store/auth-store";
import CheckoutOrderSummary from "@/components/checkout/OrderSummary";

// Mark this page as dynamic to avoid prerendering issues with useSearchParams
export const dynamic = 'force-dynamic';

type OrderData = {
  id: string;
  userId: string;
  status: string;
  total: number;
  items: Array<{
    plantId: string;
    name: string;
    quantity: number;
    price: number;
  }>;
  shippingAddress: string;
  paymentMethod?: string | null;
  transactionCode?: string | null;
  discount?: { code: string; amount: number } | null;
  createdAt: string;
};

function CheckoutSuccessPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { token } = useAuthStore();
  const orderId = searchParams.get("orderId");

  const [order, setOrder] = useState<OrderData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!orderId || !token) {
      setLoading(false);
      setError("Không tìm thấy thông tin đơn hàng.");
      return;
    }

    const fetchOrder = async () => {
      try {
        const res = await api.get(`/api/orders/myorders/${orderId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = res.data?.data?.order as OrderData | undefined;
        if (!data) throw new Error("Order not found");
        setOrder(data);
      } catch {
        setError("Đã xảy ra lỗi khi tải chi tiết đơn hàng.");
      } finally {
        setLoading(false);
      }
    };

    void fetchOrder();
  }, [orderId, token]);

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-gradient-to-b from-emerald-50 via-white to-white">
        <div className="flex flex-col items-center gap-3">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-emerald-200 border-t-emerald-600" />
          <p className="text-sm text-slate-500">Đang tải đơn hàng...</p>
        </div>
      </main>
    );
  }

  if (error || !order) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-gradient-to-b from-rose-50 via-white to-white px-4">
        <div className="w-full max-w-md text-center">
          <p className="mb-4 text-sm text-rose-600">{error}</p>
          <Link
            href="/cart"
            className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800"
          >
            Quay lại Giỏ hàng
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-emerald-50 via-white to-white px-4 py-10 md:py-16">
      <div className="mx-auto max-w-lg">
        {/* Success header */}
        <div className="mb-8 flex flex-col items-center text-center">
          {/* Animated checkmark */}
          <div className="relative mb-4">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-emerald-100 shadow-lg shadow-emerald-200/50">
              <CheckCircle2
                size={40}
                className="text-emerald-600 animate-in fade-in zoom-in duration-500"
              />
            </div>
            {/* Pulse ring */}
            <div className="absolute inset-0 animate-ping rounded-full bg-emerald-200 opacity-20" />
          </div>

          <h1 className="text-2xl font-bold tracking-tight text-slate-900 md:text-3xl">
            Đặt hàng thành công!
          </h1>
          <p className="mt-2 text-sm text-slate-600">
            {order.paymentMethod === "qr"
              ? "Đã xác nhận thanh toán. Cảm ơn bạn!"
              : "Đơn hàng đã được xác nhận. Chúng tôi sẽ thông báo cho bạn khi đơn hàng được vận chuyển."}
          </p>
        </div>

        {/* Order Summary */}
        <CheckoutOrderSummary
          orderId={order.id}
          items={order.items}
          total={order.total}
          shippingAddress={order.shippingAddress}
          paymentMethod={order.paymentMethod}
          discount={order.discount}
          status={order.status}
        />

        {/* Order date */}
        <p className="mt-4 text-center text-xs text-slate-400">
          Đặt ngày{" "}
          {new Date(order.createdAt).toLocaleDateString("vi-VN", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          })}
        </p>

        {/* Action buttons */}
        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <Link
            href="/profile/orders"
            className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-emerald-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700"
          >
            <ClipboardList size={16} />
            Xem đơn hàng của tôi
          </Link>
          <Link
            href="/shop"
            className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
          >
            <ShoppingBag size={16} />
            Tiếp tục mua sắm
          </Link>
        </div>
      </div>
    </main>
  );
}

export default function CheckoutSuccessPage() {
  return (
    <Suspense fallback={<div className="container py-8 text-center text-slate-500">Đang tải thông tin thanh toán...</div>}>
      <CheckoutSuccessPageContent />
    </Suspense>
  );
}
