"use client";

import type { PaymentSession } from "./types";

type QRPaymentModalProps = {
  open: boolean;
  session: PaymentSession | null;
  checking: boolean;
  polling: boolean;
  statusText: string;
  error: string;
  onClose: () => void;
  onConfirmPaid: () => void;
};

export default function QRPaymentModal({
  open,
  session,
  checking,
  polling,
  statusText,
  error,
  onClose,
  onConfirmPaid,
}: QRPaymentModalProps) {
  if (!open || !session) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-[1px]"
        onClick={onClose}
      />

      <section className="relative z-10 w-full max-w-md origin-center rounded-2xl bg-white p-5 shadow-2xl ring-1 ring-black/5 transition duration-200 animate-in fade-in zoom-in-95 md:p-6">
        <header className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-slate-900">
            QR Bank Transfer
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg px-2 py-1 text-sm text-slate-500 transition hover:bg-slate-100"
          >
            Close
          </button>
        </header>

        <div className="rounded-xl border border-emerald-100 bg-emerald-50 p-3 text-center">
          <img
            src={session.qrDataURL}
            alt="Payment QR"
            className="mx-auto h-52 w-52 rounded-lg bg-white p-2"
          />
        </div>

        {/* Bank Account Info */}
        {session.bankInfo && (
          <div className="mt-4 rounded-xl border border-blue-100 bg-blue-50 p-4 space-y-2">
            <p className="text-xs font-semibold text-blue-800 uppercase tracking-wide">
              Thông tin chuyển khoản
            </p>
            <div className="space-y-1.5 text-sm text-slate-700">
              <div className="flex justify-between">
                <span className="text-slate-500">Ngân hàng:</span>
                <span className="font-semibold text-slate-900">{session.bankInfo.bankName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Số tài khoản:</span>
                <span className="font-bold text-blue-700 tracking-wider">{session.bankInfo.accountNo}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Chủ tài khoản:</span>
                <span className="font-semibold text-slate-900">{session.bankInfo.accountName}</span>
              </div>
            </div>
          </div>
        )}

        <div className="mt-4 space-y-1 text-sm text-slate-700">
          <p>
            <span className="font-medium">Mã đơn hàng:</span> {session.orderId}
          </p>
          <p>
            <span className="font-medium">Nội dung CK:</span>{" "}
            {session.transactionCode}
          </p>
          <p>
            <span className="font-medium">Số tiền:</span>{" "}
            {session.amount.toLocaleString("vi-VN")} VND
          </p>
        </div>

        <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-600">
          Open your banking app, scan the QR, keep the exact transfer note, then
          tap "I have paid".
        </div>

        {statusText ? (
          <p className="mt-3 text-sm text-emerald-700">{statusText}</p>
        ) : null}
        {error ? <p className="mt-2 text-sm text-rose-600">{error}</p> : null}

        <div className="mt-5 flex flex-wrap items-center justify-between gap-2">
          <span className="text-xs text-slate-500">
            {polling ? "Auto-checking every 7 seconds" : "Polling stopped"}
          </span>

          <button
            type="button"
            onClick={onConfirmPaid}
            disabled={checking}
            className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {checking ? "Checking..." : "I have paid"}
          </button>
        </div>
      </section>
    </div>
  );
}
