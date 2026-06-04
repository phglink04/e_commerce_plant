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
};

const dotMap: Record<string, string> = {
  Delivered: "bg-emerald-500",
  active: "bg-emerald-500",
  "In Stock": "bg-emerald-500",
  Pending: "bg-amber-400",
  Paid: "bg-teal-500",
  Processing: "bg-blue-500",
  Shipped: "bg-indigo-500",
  Cancelled: "bg-rose-500",
  Failed: "bg-rose-500",
  inactive: "bg-slate-400",
  "Out Of Stock": "bg-rose-500",
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
