"use client";

import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Suspense } from "react";
import { AlertTriangle, RotateCcw, ShoppingCart, CreditCard } from "lucide-react";

function CheckoutFailedPageContent() {
  const searchParams = useSearchParams();
  const orderId = searchParams.get("orderId");

  return (
    <main className="flex min-h-screen items-center justify-center bg-gradient-to-b from-rose-50 via-white to-white px-4 py-10">
      <div className="w-full max-w-md">
        {/* Error icon */}
        <div className="mb-6 flex flex-col items-center text-center">
          <div className="relative mb-4">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-rose-100 shadow-lg shadow-rose-200/50">
              <AlertTriangle
                size={40}
                className="text-rose-600 animate-in fade-in zoom-in duration-500"
              />
            </div>
          </div>

          <h1 className="text-2xl font-bold tracking-tight text-slate-900 md:text-3xl">
            Thanh toán thất bại
          </h1>
          <p className="mt-2 max-w-sm text-sm text-slate-600">
            Chúng tôi không thể xác nhận thanh toán của bạn trong thời gian quy định. Đơn hàng của bạn vẫn chưa bị hủy — bạn có thể thử thanh toán lại.
          </p>
        </div>

        {/* Info card */}
        {orderId && (
          <div className="mb-6 rounded-xl border border-slate-200 bg-white px-4 py-3 text-center">
            <p className="text-xs text-slate-500">Mã đơn hàng</p>
            <p className="text-sm font-bold tracking-wider text-slate-800">
              #{orderId.slice(-8).toUpperCase()}
            </p>
          </div>
        )}

        {/* What happened */}
        <div className="mb-8 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          <p className="font-semibold">Có chuyện gì đã xảy ra?</p>
          <ul className="mt-1.5 list-inside list-disc space-y-0.5 text-amber-700">
            <li>Hệ thống xác nhận thanh toán hết thời gian chờ</li>
            <li>Giao dịch chuyển khoản ngân hàng vẫn đang được xử lý</li>
            <li>Nội dung chuyển tiền có thể không khớp</li>
          </ul>
        </div>

        {/* Action buttons */}
        <div className="space-y-3">
          {orderId && (
            <Link
              href={`/checkout/pending?orderId=${orderId}`}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700"
            >
              <RotateCcw size={16} />
              Thử lại thanh toán
            </Link>
          )}

          <Link
            href="/cart"
            className="flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
          >
            <ShoppingCart size={16} />
            Quay lại giỏ hàng
          </Link>

          <Link
            href="/my-orders"
            className="flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
          >
            <CreditCard size={16} />
            Xem đơn hàng của tôi
          </Link>
        </div>

        <p className="mt-6 text-center text-xs text-slate-400">
          Nếu bạn đã thực hiện chuyển tiền, hệ thống vẫn có thể tự động xác nhận thanh toán sau đó. Vui lòng kiểm tra mục &quot;Đơn hàng của tôi&quot; để cập nhật trạng thái mới nhất.
        </p>
      </div>
    </main>
  );
}

export default function CheckoutFailedPage() {
  return (
    <Suspense fallback={<div className="container py-8 text-center text-slate-500">Đang tải thông tin thanh toán...</div>}>
      <CheckoutFailedPageContent />
    </Suspense>
  );
}
