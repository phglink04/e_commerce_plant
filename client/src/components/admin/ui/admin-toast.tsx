type AdminToastProps = {
  type: "success" | "error" | "info";
  message: string;
  onClose: () => void;
};

export default function AdminToast({
  type,
  message,
  onClose,
}: AdminToastProps) {
  const styles =
    type === "success"
      ? "border-emerald-200 bg-emerald-50 text-emerald-800"
      : type === "info"
        ? "border-blue-200 bg-blue-50 text-blue-800"
        : "border-rose-200 bg-rose-50 text-rose-800";

  return (
    <div
      className={`fixed bottom-4 right-4 z-50 max-w-sm rounded-xl border px-4 py-3 text-sm shadow-lg ${styles}`}
      role="status"
      aria-live="polite"
    >
      <div className="flex items-start justify-between gap-3">
        <p>{message}</p>
        <button
          type="button"
          onClick={onClose}
          className="rounded px-1 text-xs text-slate-500 hover:bg-white/70"
        >
          x
        </button>
      </div>
    </div>
  );
}
