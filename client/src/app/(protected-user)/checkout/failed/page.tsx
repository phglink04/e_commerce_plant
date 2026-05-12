"use client";

import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { AlertTriangle, RotateCcw, ShoppingCart, CreditCard } from "lucide-react";

export default function CheckoutFailedPage() {
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
            Payment Failed
          </h1>
          <p className="mt-2 max-w-sm text-sm text-slate-600">
            We couldn&apos;t verify your payment within the time limit. Your
            order has not been cancelled — you can retry the payment.
          </p>
        </div>

        {/* Info card */}
        {orderId && (
          <div className="mb-6 rounded-xl border border-slate-200 bg-white px-4 py-3 text-center">
            <p className="text-xs text-slate-500">Order ID</p>
            <p className="text-sm font-bold tracking-wider text-slate-800">
              #{orderId.slice(-8).toUpperCase()}
            </p>
          </div>
        )}

        {/* What happened */}
        <div className="mb-8 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          <p className="font-semibold">What happened?</p>
          <ul className="mt-1.5 list-inside list-disc space-y-0.5 text-amber-700">
            <li>The payment verification timed out</li>
            <li>The bank transfer may still be processing</li>
            <li>The transfer note may not match</li>
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
              Retry Payment
            </Link>
          )}

          <Link
            href="/cart"
            className="flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
          >
            <ShoppingCart size={16} />
            Back to Cart
          </Link>

          <Link
            href="/my-orders"
            className="flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
          >
            <CreditCard size={16} />
            View My Orders
          </Link>
        </div>

        <p className="mt-6 text-center text-xs text-slate-400">
          If you already transferred, the payment may still be verified
          automatically. Check &quot;My Orders&quot; for the latest status.
        </p>
      </div>
    </main>
  );
}
