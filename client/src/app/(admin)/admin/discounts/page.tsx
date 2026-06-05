"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Plus,
  Trash2,
  Pencil,
  Tag,
  ToggleLeft,
  ToggleRight,
  Eye,
  EyeOff,
  Search,
  Infinity,
  Users,
  ShoppingCart,
  TrendingDown,
  Clock,
} from "lucide-react";
import { Pagination } from "@/components/ui";
import AdminModal from "@/components/admin/ui/admin-modal";
import AdminToast from "@/components/admin/ui/admin-toast";
import ConfirmDialog from "@/components/admin/ui/confirm-dialog";
import AdminDiscountForm from "@/components/admin/discount/AdminDiscountForm";
import { discountService } from "@/services/admin/discount.service";
import { Discount } from "@/types/discount";

function getDiscountStatus(d: Discount): "active" | "inactive" | "expired" {
  if (!d.isActive) return "inactive";
  const now = new Date();
  if (d.endDate && new Date(d.endDate) < now) return "expired";
  if (d.usageLimit !== null && d.usedCount >= d.usageLimit) return "expired";
  return "active";
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatMoney(value: number) {
  return value.toLocaleString("vi-VN");
}

const STATUS_CONFIG = {
  active: {
    label: "Hoạt động",
    dot: "bg-emerald-500",
    badge: "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200",
  },
  inactive: {
    label: "Tắt",
    dot: "bg-slate-400",
    badge: "bg-slate-100 text-slate-600 ring-1 ring-slate-200",
  },
  expired: {
    label: "Hết hạn",
    dot: "bg-rose-500",
    badge: "bg-rose-50 text-rose-600 ring-1 ring-rose-200",
  },
};

function DiscountCard({
  d,
  onEdit,
  onDelete,
  onToggleActive,
  onToggleVisible,
}: {
  d: Discount;
  onEdit: (d: Discount) => void;
  onDelete: (d: Discount) => void;
  onToggleActive: (d: Discount) => void;
  onToggleVisible: (d: Discount) => void;
}) {
  const status = getDiscountStatus(d);
  const cfg = STATUS_CONFIG[status];
  const usagePercent =
    d.usageLimit !== null && d.usageLimit > 0
      ? Math.min(100, Math.round((d.usedCount / d.usageLimit) * 100))
      : null;

  return (
    <div
      className={`relative flex flex-col gap-4 rounded-2xl border bg-white p-5 shadow-sm transition hover:shadow-md ${
        status === "expired"
          ? "border-rose-100 opacity-75"
          : status === "inactive"
            ? "border-slate-200 opacity-80"
            : "border-slate-200"
      }`}
      style={{ minHeight: "320px" }}
    >
      {/* Top row: Code + Status */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="flex items-center gap-1.5 rounded-xl bg-violet-50 px-3 py-1.5 font-mono text-sm font-bold text-violet-700 ring-1 ring-violet-200">
            <Tag size={13} />
            {d.code}
          </span>
          {/* Visibility badge */}
          <button
            onClick={() => onToggleVisible(d)}
            title={d.isVisible ? "Đang hiển thị gợi ý — bấm để ẩn" : "Đang ẩn — bấm để hiện"}
            className={`flex h-7 w-7 items-center justify-center rounded-lg transition ${
              d.isVisible
                ? "bg-violet-50 text-violet-500 hover:bg-violet-100"
                : "bg-slate-100 text-slate-400 hover:bg-slate-200"
            }`}
          >
            {d.isVisible ? <Eye size={13} /> : <EyeOff size={13} />}
          </button>
        </div>

        {/* Status badge */}
        <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold ${cfg.badge}`}>
          <span className={`h-1.5 w-1.5 rounded-full ${cfg.dot}`} />
          {cfg.label}
        </span>
      </div>

      {/* Discount % — hero number */}
      <div className="flex items-end gap-3">
        <div className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-rose-500 to-pink-600 shadow-md shadow-rose-200">
          <span className="text-lg font-black text-white">-{d.percentage}%</span>
        </div>
        <div className="flex flex-col gap-0.5 text-xs text-slate-500">
          {d.maxDiscount ? (
            <span className="flex items-center gap-1">
              <TrendingDown size={11} className="text-rose-400" />
              Giảm tối đa{" "}
              <span className="font-semibold text-slate-700">
                {formatMoney(d.maxDiscount)}₫
              </span>
            </span>
          ) : (
            <span className="flex items-center gap-1 text-slate-400">
              <TrendingDown size={11} />
              Không giới hạn mức giảm
            </span>
          )}
          <span className="flex items-center gap-1">
            <ShoppingCart size={11} className="text-slate-400" />
            Đơn tối thiểu{" "}
            <span className="font-semibold text-slate-700">
              {formatMoney(d.minOrderValue)}₫
            </span>
          </span>
        </div>
      </div>

      {/* Usage progress */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-xs">
          <span className="flex items-center gap-1 text-slate-500">
            <Users size={11} />
            Lượt dùng
          </span>
          <span className="font-semibold text-slate-700">
            {d.usedCount}
            {d.usageLimit !== null ? (
              <span className="font-normal text-slate-400">/{d.usageLimit}</span>
            ) : (
              <span className="text-emerald-500">/∞</span>
            )}
          </span>
        </div>
        {usagePercent !== null ? (
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
            <div
              className={`h-full rounded-full transition-all ${
                usagePercent >= 100
                  ? "bg-rose-400"
                  : usagePercent >= 75
                    ? "bg-amber-400"
                    : "bg-emerald-400"
              }`}
              style={{ width: `${usagePercent}%` }}
            />
          </div>
        ) : (
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-emerald-50">
            <div className="h-full w-full animate-pulse rounded-full bg-emerald-200 opacity-60" />
          </div>
        )}
        {/* Per-user limit */}
        <p className="text-[10px] text-slate-400">
          {d.usageLimitPerUser !== null ? (
            <>Tối đa <span className="font-semibold text-slate-600">{d.usageLimitPerUser} lần</span>/người</>
          ) : (
            <>Không giới hạn lần dùng/người</>
          )}
        </p>
      </div>

      {/* Time period — chiều cao cố định để các card thẳng hàng */}
      <div className="mt-auto flex min-h-[52px] items-start gap-2 rounded-xl bg-slate-50 px-3 py-2.5 text-xs text-slate-500">
        <Clock size={13} className="mt-0.5 shrink-0 text-slate-400" />
        {d.startDate || d.endDate ? (
          <div className="flex flex-col gap-0.5">
            <span>
              <span className="text-slate-400">Từ: </span>
              {d.startDate ? (
                <span className="font-medium text-slate-700">
                  {formatTime(d.startDate)} · {formatDate(d.startDate)}
                </span>
              ) : (
                <span className="text-slate-400">—</span>
              )}
            </span>
            <span>
              <span className="text-slate-400">Đến: </span>
              {d.endDate ? (
                <span
                  className={`font-medium ${
                    new Date(d.endDate) < new Date()
                      ? "text-rose-600"
                      : "text-slate-700"
                  }`}
                >
                  {formatTime(d.endDate)} · {formatDate(d.endDate)}
                </span>
              ) : (
                <span className="text-slate-400">—</span>
              )}
            </span>
          </div>
        ) : (
          <span className="font-semibold text-emerald-600">∞ Vĩnh viễn</span>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center justify-end gap-1 border-t border-slate-100 pt-3">
        <button
          onClick={() => onToggleActive(d)}
          title={d.isActive ? "Vô hiệu hóa" : "Kích hoạt"}
          className={`inline-flex h-8 w-8 items-center justify-center rounded-lg transition ${
            d.isActive
              ? "text-amber-600 hover:bg-amber-50"
              : "text-emerald-600 hover:bg-emerald-50"
          }`}
        >
          {d.isActive ? <ToggleRight size={17} /> : <ToggleLeft size={17} />}
        </button>
        <button
          onClick={() => onEdit(d)}
          className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-blue-500 transition hover:bg-blue-50"
          title="Chỉnh sửa"
        >
          <Pencil size={15} />
        </button>
        <button
          onClick={() => onDelete(d)}
          className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-rose-500 transition hover:bg-rose-50"
          title="Xóa"
        >
          <Trash2 size={15} />
        </button>
      </div>
    </div>
  );
}

export default function AdminDiscountsPage() {
  const [discounts, setDiscounts] = useState<Discount[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState<{
    totalResults: number;
    totalPages: number;
    page: number;
  } | null>(null);

  const [showForm, setShowForm] = useState(false);
  const [editingDiscount, setEditingDiscount] = useState<Discount | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Discount | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [toast, setToast] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  // Debounce search
  useEffect(() => {
    const t = window.setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 400);
    return () => window.clearTimeout(t);
  }, [search]);

  const fetchDiscounts = useCallback(async () => {
    try {
      setLoading(true);
      const result = await discountService.getDiscounts({
        page,
        limit: 12,
        search: debouncedSearch || undefined,
        status: statusFilter || undefined,
      });
      setDiscounts(result.items);
      setPagination({
        totalResults: result.totalResults,
        totalPages: result.totalPages,
        page: result.page,
      });
    } catch (err) {
      console.error("Failed to fetch discounts:", err);
      setToast({ type: "error", message: "Không thể tải danh sách mã giảm giá" });
    } finally {
      setLoading(false);
    }
  }, [page, debouncedSearch, statusFilter]);

  useEffect(() => { fetchDiscounts(); }, [fetchDiscounts]);

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      setDeleting(true);
      await discountService.deleteDiscount(deleteTarget.id);
      setToast({ type: "success", message: "Đã xóa mã giảm giá" });
      setDeleteTarget(null);
      fetchDiscounts();
    } catch (err) {
      setToast({
        type: "error",
        message: err instanceof Error ? err.message : "Không thể xóa mã giảm giá",
      });
    } finally {
      setDeleting(false);
    }
  };

  const handleToggleActive = async (d: Discount) => {
    try {
      await discountService.updateDiscount(d.id, { isActive: !d.isActive });
      setToast({ type: "success", message: d.isActive ? "Đã vô hiệu hóa" : "Đã kích hoạt" });
      fetchDiscounts();
    } catch {
      setToast({ type: "error", message: "Không thể cập nhật trạng thái" });
    }
  };

  const handleToggleVisible = async (d: Discount) => {
    try {
      await discountService.updateDiscount(d.id, { isVisible: !d.isVisible });
      setToast({
        type: "success",
        message: d.isVisible ? "Đã ẩn khỏi danh sách gợi ý" : "Đã hiển thị trong danh sách gợi ý",
      });
      fetchDiscounts();
    } catch {
      setToast({ type: "error", message: "Không thể cập nhật hiển thị" });
    }
  };

  const handleFormSuccess = () => {
    setToast({
      type: "success",
      message: editingDiscount ? "Đã cập nhật mã giảm giá" : "Đã tạo mã giảm giá mới",
    });
    fetchDiscounts();
  };

  // Stats summary
  const activeCount = discounts.filter((d) => getDiscountStatus(d) === "active").length;
  const expiredCount = discounts.filter((d) => getDiscountStatus(d) === "expired").length;

  return (
    <section className="space-y-6">
      {/* Header */}
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="flex items-center gap-2 text-2xl font-bold tracking-tight text-slate-900">
            <Tag size={22} className="text-violet-500" />
            Mã giảm giá
          </h2>
          <p className="mt-0.5 text-sm text-slate-500">
            {pagination?.totalResults?.toLocaleString() ?? 0} mã · {" "}
            <span className="text-emerald-600 font-medium">{activeCount} hoạt động</span>
            {expiredCount > 0 && (
              <>, <span className="text-rose-500 font-medium">{expiredCount} hết hạn</span></>
            )}
          </p>
        </div>
        <button
          onClick={() => { setEditingDiscount(null); setShowForm(true); }}
          className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-violet-500 px-4 py-2.5 text-sm font-semibold text-white shadow-md shadow-violet-200 transition hover:from-violet-700 hover:to-violet-600"
        >
          <Plus size={16} />
          Tạo mã mới
        </button>
      </header>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Tìm mã giảm giá…"
            className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-9 pr-3 text-sm outline-none transition focus:border-violet-400 focus:ring-2 focus:ring-violet-100"
          />
        </div>
        {(["", "active", "inactive"] as const).map((val) => (
          <button
            key={val}
            onClick={() => { setStatusFilter(val); setPage(1); }}
            className={`rounded-xl px-3.5 py-2 text-sm font-medium transition ${
              statusFilter === val
                ? "bg-violet-600 text-white shadow-sm"
                : "border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
            }`}
          >
            {val === "" ? "Tất cả" : val === "active" ? "Hoạt động" : "Không hoạt động"}
          </button>
        ))}
        {loading && (
          <span className="flex items-center gap-1.5 text-xs text-slate-400">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-violet-400" />
            Đang tải…
          </span>
        )}
      </div>

      {/* Cards grid */}
      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-64 animate-pulse rounded-2xl bg-slate-100" />
          ))}
        </div>
      ) : discounts.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {discounts.map((d) => (
            <DiscountCard
              key={d.id}
              d={d}
              onEdit={(d) => { setEditingDiscount(d); setShowForm(true); }}
              onDelete={setDeleteTarget}
              onToggleActive={handleToggleActive}
              onToggleVisible={handleToggleVisible}
            />
          ))}
        </div>
      ) : (
        <div className="flex h-52 flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-slate-50">
          <Tag size={32} className="mb-2 text-slate-300" />
          <p className="text-slate-400">Chưa có mã giảm giá nào</p>
          <button
            onClick={() => { setEditingDiscount(null); setShowForm(true); }}
            className="mt-3 text-sm font-semibold text-violet-600 hover:text-violet-700"
          >
            Tạo mã đầu tiên →
          </button>
        </div>
      )}

      {/* Pagination */}
      {pagination && pagination.totalPages > 1 && (
        <Pagination
          currentPage={pagination.page}
          totalPages={pagination.totalPages}
          onPageChange={setPage}
          isLoading={loading}
        />
      )}

      {/* Create/Edit Form Modal */}
      {showForm && (
        <AdminModal
          title={editingDiscount ? "Chỉnh sửa mã giảm giá" : "Tạo mã giảm giá mới"}
          open={true}
          onClose={() => { setShowForm(false); setEditingDiscount(null); }}
        >
          <AdminDiscountForm
            discount={editingDiscount}
            onClose={() => { setShowForm(false); setEditingDiscount(null); }}
            onSuccess={handleFormSuccess}
          />
        </AdminModal>
      )}

      {/* Delete Confirmation */}
      {deleteTarget && (
        <ConfirmDialog
          title="Xóa mã giảm giá"
          description={`Bạn có chắc chắn muốn xóa mã "${deleteTarget.code}"? Hành động này không thể hoàn tác.`}
          confirmLabel="Xóa"
          cancelLabel="Hủy"
          open={!!deleteTarget}
          loading={deleting}
          onConfirm={handleDelete}
          onCancel={() => setDeleteTarget(null)}
          variant="danger"
        />
      )}

      {/* Toast */}
      {toast && (
        <AdminToast
          type={toast.type}
          message={toast.message}
          onClose={() => setToast(null)}
        />
      )}
    </section>
  );
}
