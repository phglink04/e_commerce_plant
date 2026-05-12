"use client";

import { useState } from "react";
import { Copy, CheckCircle2 } from "lucide-react";

type QRDisplayProps = {
  qrDataURL: string;
  transactionCode: string;
  amount: number;
  bankInfo?: {
    accountNo: string;
    accountName: string;
    bankName: string;
  };
};

export default function QRDisplay({
  qrDataURL,
  transactionCode,
  amount,
  bankInfo,
}: QRDisplayProps) {
  const [copied, setCopied] = useState(false);

  const copyCode = async () => {
    try {
      await navigator.clipboard.writeText(transactionCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback — ignore clipboard errors
    }
  };

  const copyAccountNo = async () => {
    if (!bankInfo?.accountNo) return;
    try {
      await navigator.clipboard.writeText(bankInfo.accountNo);
    } catch {
      // ignore
    }
  };

  return (
    <div className="flex flex-col items-center gap-4">
      {/* QR Image */}
      <div className="rounded-2xl border-2 border-emerald-100 bg-gradient-to-b from-emerald-50 to-white p-3 shadow-sm">
        <img
          src={qrDataURL}
          alt="Payment QR Code"
          className="h-56 w-56 rounded-xl bg-white p-2 sm:h-64 sm:w-64"
          draggable={false}
        />
      </div>

      {/* Bank Info */}
      {bankInfo && (
        <div className="w-full max-w-xs rounded-xl border border-blue-100 bg-blue-50 p-4 space-y-2">
          <p className="text-xs font-semibold text-blue-800 uppercase tracking-wide text-center">
            Thông tin chuyển khoản
          </p>
          <div className="space-y-1.5 text-sm text-slate-700">
            <div className="flex justify-between">
              <span className="text-slate-500">Ngân hàng:</span>
              <span className="font-semibold text-slate-900">{bankInfo.bankName}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-500">Số TK:</span>
              <button
                type="button"
                onClick={() => void copyAccountNo()}
                className="font-bold text-blue-700 tracking-wider hover:text-blue-900 transition"
                title="Click để copy"
              >
                {bankInfo.accountNo}
              </button>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Chủ TK:</span>
              <span className="font-semibold text-slate-900">{bankInfo.accountName}</span>
            </div>
          </div>
        </div>
      )}

      {/* Amount */}
      <div className="text-center">
        <p className="text-sm text-slate-500">Số tiền chuyển khoản</p>
        <p className="text-2xl font-bold text-slate-900">
          {amount.toLocaleString("vi-VN")}{" "}
          <span className="text-base font-medium text-slate-500">VND</span>
        </p>
      </div>

      {/* Transaction Code */}
      <div className="flex w-full max-w-xs items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5">
        <div className="min-w-0 flex-1">
          <p className="text-xs text-slate-500">Transfer note (required)</p>
          <p className="truncate text-sm font-bold tracking-wider text-slate-800">
            {transactionCode}
          </p>
        </div>
        <button
          type="button"
          onClick={() => void copyCode()}
          className="flex-none rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-200 hover:text-slate-600"
          title="Copy transaction code"
        >
          {copied ? (
            <CheckCircle2 size={16} className="text-emerald-500" />
          ) : (
            <Copy size={16} />
          )}
        </button>
      </div>

      {/* Instructions */}
      <ol className="w-full max-w-xs space-y-1.5 text-xs text-slate-600">
        <li className="flex gap-2">
          <span className="flex h-5 w-5 flex-none items-center justify-center rounded-full bg-emerald-100 text-[10px] font-bold text-emerald-700">
            1
          </span>
          <span>Open your banking app and scan the QR code</span>
        </li>
        <li className="flex gap-2">
          <span className="flex h-5 w-5 flex-none items-center justify-center rounded-full bg-emerald-100 text-[10px] font-bold text-emerald-700">
            2
          </span>
          <span>
            Transfer exactly{" "}
            <strong>{amount.toLocaleString("vi-VN")} VND</strong>
          </span>
        </li>
        <li className="flex gap-2">
          <span className="flex h-5 w-5 flex-none items-center justify-center rounded-full bg-emerald-100 text-[10px] font-bold text-emerald-700">
            3
          </span>
          <span>Keep the transfer note unchanged</span>
        </li>
        <li className="flex gap-2">
          <span className="flex h-5 w-5 flex-none items-center justify-center rounded-full bg-emerald-100 text-[10px] font-bold text-emerald-700">
            4
          </span>
          <span>Wait for auto-verification or tap &quot;I have paid&quot;</span>
        </li>
      </ol>
    </div>
  );
}
