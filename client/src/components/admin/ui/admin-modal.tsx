"use client";

type AdminModalProps = {
  open: boolean;
  title: string;
  children: React.ReactNode;
  onClose: () => void;
  size?: "sm" | "md" | "lg";
};

const sizeMap = {
  sm: "max-w-lg",
  md: "max-w-2xl",
  lg: "max-w-4xl",
};

export default function AdminModal({
  open,
  title,
  children,
  onClose,
  size = "sm",
}: AdminModalProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />

      <section className={`relative z-10 w-full ${sizeMap[size]} rounded-2xl border border-slate-200 bg-white p-5 shadow-2xl max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in-95 duration-200`}>
        <header className="mb-4 flex items-center justify-between gap-2">
          <h3 className="text-lg font-semibold text-slate-900">{title}</h3>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg px-2 py-1 text-sm text-slate-600 hover:bg-slate-100"
          >
            Đóng
          </button>
        </header>

        {children}
      </section>
    </div>
  );
}

