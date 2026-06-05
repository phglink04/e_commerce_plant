type StatusVariant =
  | "Pending"
  | "Processing"
  | "Shipped"
  | "Delivered"
  | "Cancelled"
  | "active"
  | "inactive"
  | string;

const variantMap: Record<string, string> = {
  // English keys (fallback / user roles)
  Pending: "bg-amber-100 text-amber-800 border-amber-200",
  Paid: "bg-teal-100 text-teal-800 border-teal-200",
  Processing: "bg-blue-100 text-blue-800 border-blue-200",
  Shipped: "bg-indigo-100 text-indigo-800 border-indigo-200",
  Delivered: "bg-emerald-100 text-emerald-800 border-emerald-200",
  Cancelled: "bg-rose-100 text-rose-800 border-rose-200",
  Failed: "bg-rose-100 text-rose-800 border-rose-200",
  active: "bg-emerald-100 text-emerald-800 border-emerald-200",
  inactive: "bg-slate-100 text-slate-600 border-slate-200",
  "In Stock": "bg-emerald-100 text-emerald-800 border-emerald-200",
  "Out Of Stock": "bg-rose-100 text-rose-800 border-rose-200",
  admin: "bg-red-100 text-red-800 border-red-200",
  user: "bg-blue-100 text-blue-800 border-blue-200",
  deliverypartner: "bg-amber-100 text-amber-800 border-amber-200",

  // ── Order status (Vietnamese labels) ──
  "Chờ xác nhận":  "bg-amber-100  text-amber-800  border-amber-200",
  "Đã xác nhận":   "bg-sky-100    text-sky-800    border-sky-200",
  "Đang chuẩn bị": "bg-blue-100   text-blue-800   border-blue-200",
  "Đã gửi":        "bg-indigo-100 text-indigo-800 border-indigo-200",
  "Đã nhận":       "bg-emerald-100 text-emerald-800 border-emerald-200",
  "Đã hủy":        "bg-rose-100   text-rose-800   border-rose-200",
  "Hoàn trả":      "bg-orange-100 text-orange-800 border-orange-200",

  // ── Payment status (Vietnamese labels) ──
  "Chưa thanh toán":    "bg-amber-100  text-amber-800  border-amber-200",
  "Đã trả tiền":        "bg-teal-100   text-teal-800   border-teal-200",
  "Thanh toán thất bại":"bg-rose-100   text-rose-800   border-rose-200",
  "Đã hoàn tiền":       "bg-purple-100 text-purple-800 border-purple-200",
};

const dotMap: Record<string, string> = {
  // English
  Delivered:   "bg-emerald-500",
  active:      "bg-emerald-500",
  "In Stock":  "bg-emerald-500",
  Pending:     "bg-amber-400",
  Paid:        "bg-teal-500",
  Processing:  "bg-blue-500",
  Shipped:     "bg-indigo-500",
  Cancelled:   "bg-rose-500",
  Failed:      "bg-rose-500",
  inactive:    "bg-slate-400",
  "Out Of Stock": "bg-rose-500",

  // ── Order status (Vietnamese) ──
  "Chờ xác nhận":  "bg-amber-400",
  "Đã xác nhận":   "bg-sky-500",
  "Đang chuẩn bị": "bg-blue-500",
  "Đã gửi":        "bg-indigo-500",
  "Đã nhận":       "bg-emerald-500",
  "Đã hủy":        "bg-rose-500",
  "Hoàn trả":      "bg-orange-500",

  // ── Payment status (Vietnamese) ──
  "Chưa thanh toán":    "bg-amber-400",
  "Đã trả tiền":        "bg-teal-500",
  "Thanh toán thất bại":"bg-rose-500",
  "Đã hoàn tiền":       "bg-purple-500",
};

type StatusBadgeProps = {
  status: StatusVariant;
  showDot?: boolean;
  size?: "sm" | "md";
};

export default function StatusBadge({
  status,
  showDot = false,
  size = "sm",
}: StatusBadgeProps) {
  const cls =
    variantMap[status] ?? "bg-slate-100 text-slate-600 border-slate-200";
  const dot = dotMap[status] ?? "bg-slate-400";
  const padding = size === "sm" ? "px-2.5 py-0.5 text-xs" : "px-3 py-1 text-sm";

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border font-semibold ${cls} ${padding}`}
    >
      {showDot && (
        <span className={`h-1.5 w-1.5 rounded-full shrink-0 ${dot}`} />
      )}
      {status}
    </span>
  );
}
