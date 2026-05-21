"use client";

import { CheckCircle2, Clock, AlertTriangle, Loader2 } from "lucide-react";

type PaymentStatusType = "idle" | "checking" | "pending" | "success" | "failed" | "expired";

type PaymentStatusProps = {
  status: PaymentStatusType;
  message?: string;
};

const statusConfig: Record<
  PaymentStatusType,
  { icon: React.ReactNode; label: string; className: string }
> = {
  idle: {
    icon: <Clock size={18} />,
    label: "Đang chờ thanh toán",
    className: "border-slate-200 bg-slate-50 text-slate-600",
  },
  checking: {
    icon: <Loader2 size={18} className="animate-spin" />,
    label: "Đang kiểm tra thanh toán...",
    className: "border-amber-200 bg-amber-50 text-amber-700",
  },
  pending: {
    icon: (
      <span className="relative flex h-3 w-3">
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-amber-400 opacity-75" />
        <span className="relative inline-flex h-3 w-3 rounded-full bg-amber-500" />
      </span>
    ),
    label: "Tự động kiểm tra thanh toán mỗi 5 giây",
    className: "border-amber-200 bg-amber-50 text-amber-700",
  },
  success: {
    icon: <CheckCircle2 size={18} />,
    label: "Thanh toán được xác nhận!",
    className: "border-emerald-200 bg-emerald-50 text-emerald-700",
  },
  failed: {
    icon: <AlertTriangle size={18} />,
    label: "Không tìm thấy thanh toán",
    className: "border-rose-200 bg-rose-50 text-rose-600",
  },
  expired: {
    icon: <AlertTriangle size={18} />,
    label: "Hết thời gian thanh toán",
    className: "border-rose-200 bg-rose-50 text-rose-600",
  },
};

export default function PaymentStatus({ status, message }: PaymentStatusProps) {
  const config = statusConfig[status];

  return (
    <div
      className={`flex items-center gap-2.5 rounded-xl border px-4 py-3 text-sm font-medium transition-colors duration-300 ${config.className}`}
    >
      <span className="flex-none">{config.icon}</span>
      <span>{message ?? config.label}</span>
    </div>
  );
}

export type { PaymentStatusType };
