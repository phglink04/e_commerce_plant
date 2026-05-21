"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import api from "@/lib/api";
import { useAuthStore } from "@/store/auth-store";
import QRDisplay from "@/components/checkout/QRDisplay";
import CountdownTimer from "@/components/checkout/CountdownTimer";
import PaymentStatus from "@/components/checkout/PaymentStatus";
import type { PaymentStatusType } from "@/components/checkout/PaymentStatus";
import CheckoutOrderSummary from "@/components/checkout/OrderSummary";

const POLL_INTERVAL_MS = 5000;
const COUNTDOWN_SECONDS = 300; // 5 minutes
const SESSION_KEY_PREFIX = "checkout_pending_";

type OrderData = {
  id: string;
  orderStatus: string;
  paymentStatus: string;
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

type SessionData = {
  qrDataURL: string;
  transactionCode: string;
  amount: number;
  bankInfo?: {
    accountNo: string;
    accountName: string;
    bankName: string;
  };
};

export default function CheckoutPendingPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { token } = useAuthStore();
  const orderId = searchParams.get("orderId");

  const [order, setOrder] = useState<OrderData | null>(null);
  const [qrData, setQrData] = useState<SessionData | null>(null);
  const [paymentStatus, setPaymentStatus] =
    useState<PaymentStatusType>("idle");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [expired, setExpired] = useState(false);

  const checkingRef = useRef(false);
  const paidRef = useRef(false);

  // Load order + QR data
  useEffect(() => {
    if (!orderId || !token) {
      setLoading(false);
      setError("Missing order information.");
      return;
    }

    const init = async () => {
      try {
        // 1. Fetch order
        const orderRes = await api.get(`/api/orders/myorders/${orderId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const orderData = orderRes.data?.data?.order as OrderData | undefined;
        if (!orderData) throw new Error("Order not found");

        // If already paid, redirect to success
        if (orderData.paymentStatus === "paid") {
          router.replace(`/checkout/success?orderId=${orderId}`);
          return;
        }

        setOrder(orderData);

        // 2. Try to get QR from sessionStorage
        const sessionKey = `${SESSION_KEY_PREFIX}${orderId}`;
        const stored = sessionStorage.getItem(sessionKey);

        if (stored) {
          try {
            const parsed = JSON.parse(stored) as SessionData;
            if (parsed.qrDataURL && parsed.transactionCode && parsed.amount) {
              setQrData(parsed);
              setPaymentStatus("pending");
              return;
            }
          } catch {
            // Ignore parse errors, regenerate below
          }
        }

        // 3. Generate QR (will reuse saved transactionCode on server)
        const qrRes = await api.post(
          "/api/payment/generate-qr",
          { orderId },
          { headers: { Authorization: `Bearer ${token}` } },
        );

        const newQrData: SessionData = {
          qrDataURL: qrRes.data?.qrDataURL as string,
          transactionCode: qrRes.data?.transactionCode as string,
          amount: Number(qrRes.data?.amount ?? 0),
          bankInfo: qrRes.data?.bankInfo as SessionData['bankInfo'],
        };

        if (!newQrData.qrDataURL || !newQrData.transactionCode) {
          throw new Error("Failed to generate QR code");
        }

        // Save to session for page refresh
        sessionStorage.setItem(sessionKey, JSON.stringify(newQrData));
        setQrData(newQrData);
        setPaymentStatus("pending");
      } catch (err) {
        const msg =
          err instanceof Error ? err.message : "Unable to load checkout.";
        setError(msg);
      } finally {
        setLoading(false);
      }
    };

    void init();
  }, [orderId, token, router]);

  // Verify payment
  const verifyPayment = useCallback(
    async (silent = true) => {
      if (!token || !orderId || !qrData || checkingRef.current || paidRef.current) {
        return;
      }

      checkingRef.current = true;
      if (!silent) {
        setPaymentStatus("checking");
        setError("");
      }

      try {
        const res = await api.get(`/api/payment/check/${orderId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        const paid = Boolean(res.data?.paid);

        if (paid) {
          paidRef.current = true;
          setPaymentStatus("success");
          // Clean up session storage
          sessionStorage.removeItem(`${SESSION_KEY_PREFIX}${orderId}`);
          // Clear purchased items from cart
          try {
            if (order) {
              await Promise.all(
                order.items.map((item) =>
                  api.delete(`/api/users/deleteitem/${item.plantId}`, {
                    headers: { Authorization: `Bearer ${token}` },
                  }),
                ),
              );
            }
          } catch {
            // Cart cleanup failure is non-critical
          }
          // Redirect after a brief success animation
          setTimeout(() => {
            router.replace(`/checkout/success?orderId=${orderId}`);
          }, 1500);
        } else if (!silent) {
          setPaymentStatus("pending");
          setError("Payment not found yet. Please complete the transfer.");
        }
      } catch {
        if (!silent) {
          setPaymentStatus("failed");
          setError("Unable to verify payment. Please try again.");
        }
      } finally {
        checkingRef.current = false;
      }
    },
    [token, orderId, qrData, order, router],
  );

  // Auto-poll
  useEffect(() => {
    if (!qrData || expired || paidRef.current) return;

    const intervalId = window.setInterval(() => {
      void verifyPayment(true);
    }, POLL_INTERVAL_MS);

    return () => window.clearInterval(intervalId);
  }, [qrData, expired, verifyPayment]);

  // Handle countdown expiry
  const handleExpire = useCallback(() => {
    setExpired(true);
    setPaymentStatus("expired");
    if (orderId) {
      sessionStorage.removeItem(`${SESSION_KEY_PREFIX}${orderId}`);
    }
  }, [orderId]);

  // Loading state
  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-gradient-to-b from-amber-50 via-white to-white">
        <div className="flex flex-col items-center gap-3">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-amber-200 border-t-amber-600" />
          <p className="text-sm text-slate-500">Preparing payment...</p>
        </div>
      </main>
    );
  }

  // Error / missing data
  if (error && !qrData) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-gradient-to-b from-rose-50 via-white to-white px-4">
        <div className="w-full max-w-md text-center">
          <div className="mb-4 flex justify-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-rose-100">
              <span className="text-3xl">⚠️</span>
            </div>
          </div>
          <p className="mb-6 text-sm text-rose-600">{error}</p>
          <Link
            href="/cart"
            className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800"
          >
            Back to Cart
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-amber-50 via-white to-white px-4 py-8 md:py-12">
      <div className="mx-auto max-w-5xl">
        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 md:text-3xl">
            Complete Your Payment
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Quét mã QR bằng ứng dụng ngân hàng của bạn để hoàn thành đơn hàng
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1fr_380px]">
          {/* Left: QR + Timer + Status */}
          <div className="space-y-6">
            {/* QR Card */}
            <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              {qrData && !expired && (
                <QRDisplay
                  qrDataURL={qrData.qrDataURL}
                  transactionCode={qrData.transactionCode}
                  amount={qrData.amount}
                  bankInfo={qrData.bankInfo}
                />
              )}

              {expired && (
                <div className="flex flex-col items-center gap-4 py-8 text-center">
                  <div className="flex h-16 w-16 items-center justify-center rounded-full bg-rose-100">
                    <span className="text-3xl">⏰</span>
                  </div>
                  <div>
                    <p className="text-lg font-semibold text-slate-900">
                      Payment Time Expired
                    </p>
                    <p className="mt-1 text-sm text-slate-500">
                      The QR code has expired. You can generate a new one or go
                      back to cart.
                    </p>
                  </div>
                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={() => {
                        if (orderId) {
                          router.replace(
                            `/checkout/failed?orderId=${orderId}`,
                          );
                        }
                      }}
                      className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                    >
                      View Options
                    </button>
                  </div>
                </div>
              )}
            </section>

            {/* Timer + Status */}
            {!expired && qrData && (
              <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-start sm:justify-between">
                <CountdownTimer
                  durationSeconds={COUNTDOWN_SECONDS}
                  onExpire={handleExpire}
                />

                <div className="flex w-full flex-col gap-3 sm:w-auto sm:min-w-[240px]">
                  <PaymentStatus status={paymentStatus} message={error || undefined} />

                  <button
                    type="button"
                    onClick={() => void verifyPayment(false)}
                    disabled={
                      paymentStatus === "checking" ||
                      paymentStatus === "success"
                    }
                    className="w-full rounded-xl bg-emerald-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {paymentStatus === "checking"
                      ? "\u0110ang kiểm tra..."
                      : paymentStatus === "success"
                        ? "Thanh toán đũ̆c xác nhẫn!"
                        : "Tôi đã thanh toán"}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Right: Order Summary */}
          <div className="lg:sticky lg:top-24">
            {order && (
              <CheckoutOrderSummary
                orderId={order.id}
                items={order.items}
                total={order.total}
                shippingAddress={order.shippingAddress}
                paymentMethod={order.paymentMethod}
                discount={order.discount}
                status={order.orderStatus}
              />
            )}

            <div className="mt-4 text-center">
              <Link
                href="/cart"
                className="text-sm text-slate-500 transition hover:text-slate-700 hover:underline"
              >
                ← Back to Cart
              </Link>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
