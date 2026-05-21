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
} from "lucide-react";
import { SearchBar, Pagination } from "@/components/ui";
import AdminModal from "@/components/admin/ui/admin-modal";
import AdminToast from "@/components/admin/ui/admin-toast";
import ConfirmDialog from "@/components/admin/ui/confirm-dialog";
import AdminDiscountForm from "@/components/admin/discount/AdminDiscountForm";
import { discountService } from "@/services/admin/discount.service";
import { Discount } from "@/types/discount";

const statusColors: Record<string, string> = {
  active: "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200",
  inactive: "bg-slate-100 text-slate-600 ring-1 ring-slate-200",
  expired: "bg-red-50 text-red-600 ring-1 ring-red-200",
};

function getDiscountStatus(d: Discount): string {
  if (!d.isActive) return "inactive";
  const now = new Date();
  if (new Date(d.endDate) < now) return "expired";
  if (new Date(d.startDate) > now) return "inactive";
  if (d.usedCount >= d.usageLimit) return "inactive";
  return "active";
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatMoney(value: number) {
  return value.toLocaleString("vi-VN");
}

export default function AdminDiscountsPage() {
  const [discounts, setDiscounts] = useState<Discount[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
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

  const fetchDiscounts = useCallback(async () => {
    try {
      setLoading(true);
      const result = await discountService.getDiscounts({
        page,
        limit: 12,
        search: search || undefined,
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
      setToast({
        type: "error",
        message: "Không thể tải danh sách mã giảm giá",
      });
    } finally {
      setLoading(false);
    }
  }, [page, search, statusFilter]);

  useEffect(() => {
    fetchDiscounts();
  }, [fetchDiscounts]);

  const handleCreate = () => {
    setEditingDiscount(null);
    setShowForm(true);
  };

  const handleEdit = (d: Discount) => {
    setEditingDiscount(d);
    setShowForm(true);
  };

  const handleCloseForm = () => {
    setShowForm(false);
    setEditingDiscount(null);
  };

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
        message:
          err instanceof Error ? err.message : "Không thể xóa mã giảm giá",
      });
    } finally {
      setDeleting(false);
    }
  };

  const handleToggleActive = async (d: Discount) => {
    try {
      await discountService.updateDiscount(d.id, {
        isActive: !d.isActive,
      });
      setToast({
        type: "success",
        message: d.isActive ? "Đã vô hiệu hóa" : "Đã kích hoạt",
      });
      fetchDiscounts();
    } catch {
      setToast({
        type: "error",
        message: "Không thể cập nhật trạng thái",
      });
    }
  };

  const handleToggleVisible = async (d: Discount) => {
    try {
      await discountService.updateDiscount(d.id, {
        isVisible: !d.isVisible,
      });
      setToast({
        type: "success",
        message: d.isVisible ? "Đã ẩn khỏi danh sách gợi ý" : "Đã hiển thị trong danh sách gợi ý",
      });
      fetchDiscounts();
    } catch {
      setToast({
        type: "error",
        message: "Không thể cập nhật hiển thị",
      });
    }
  };

  const handleFormSuccess = () => {
    setToast({
      type: "success",
      message: editingDiscount
        ? "Đã cập nhật mã giảm giá"
        : "Đã tạo mã giảm giá mới",
    });
    fetchDiscounts();
  };

  const goToPage = (p: number) => setPage(p);

  return (
    <section className="space-y-5">
      {/* Header */}
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900">
            <Tag className="mr-2 inline-block" size={24} />
            Mã giảm giá
          </h2>
          <p className="mt-0.5 text-sm text-slate-500">
            {pagination?.totalResults?.toLocaleString() || 0} mã giảm giá
          </p>
        </div>
        <button
          onClick={handleCreate}
          className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-500 px-4 py-2.5 text-sm font-semibold text-white shadow-md shadow-emerald-200 transition hover:from-emerald-700 hover:to-emerald-600"
        >
          <Plus size={16} />
          Tạo mã
        </button>
      </header>

      {/* Filters Row */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex-1">
          <SearchBar
            onSearch={(val) => {
              setSearch(val);
              setPage(1);
            }}
            placeholder="Tìm kiếm mã giảm giá…"
            debounceDelay={500}
          />
        </div>

        <select
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value);
            setPage(1);
          }}
          className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none transition focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100"
        >
          <option value="">Tất cả</option>
          <option value="active">Hoạt động</option>
          <option value="inactive">Không hoạt động</option>
        </select>
      </div>

      {/* Discounts Table */}
      {!loading && discounts.length > 0 ? (
        <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
          <table className="w-full">
            <thead className="border-b border-slate-200 bg-slate-50">
              <tr className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                <th className="px-4 py-3 text-left">Mã</th>
                <th className="px-4 py-3 text-center">Giảm giá</th>
                <th className="px-4 py-3 text-right">Giảm tối đa</th>
                <th className="px-4 py-3 text-right">Đơn tối thiểu</th>
                <th className="px-4 py-3 text-center">Lượt dùng</th>
                <th className="px-4 py-3 text-center">Trạng thái</th>
                <th className="px-4 py-3 text-center">Hiển thị</th>
                <th className="px-4 py-3 text-left">Thời gian</th>
                <th className="px-4 py-3 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {discounts.map((d) => {
                const status = getDiscountStatus(d);
                return (
                  <tr key={d.id} className="transition hover:bg-slate-50/80">
                    <td className="px-4 py-3">
                      <div>
                        <span className="inline-flex items-center gap-1.5 rounded-lg bg-violet-50 px-2.5 py-1 text-sm font-bold text-violet-700 tracking-wide ring-1 ring-violet-200">
                          <Tag size={12} />
                          {d.code}
                        </span>
                        {d.name && (
                          <p className="mt-0.5 text-xs text-slate-400">{d.name}</p>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className="inline-flex items-center rounded-full bg-rose-50 px-2.5 py-1 text-sm font-bold text-rose-600 ring-1 ring-rose-200">
                        -{d.percentage}%
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right text-sm tabular-nums">
                      {d.maxDiscount ? (
                        <span className="font-medium text-slate-700">{formatMoney(d.maxDiscount)}₫</span>
                      ) : (
                        <span className="text-slate-400 text-xs">Không giới hạn</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right text-sm text-slate-600 tabular-nums">
                      {formatMoney(d.minOrderValue)}₫
                    </td>
                    <td className="px-4 py-3 text-center text-sm">
                      <span className="font-semibold text-slate-800">
                        {d.usedCount}
                      </span>
                      <span className="text-slate-400">/{d.usageLimit}</span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span
                        className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold ${
                          statusColors[status] || statusColors.inactive
                        }`}
                      >
                        <span
                          className={`h-1.5 w-1.5 rounded-full ${
                            status === "active"
                              ? "bg-emerald-500"
                              : status === "expired"
                                ? "bg-red-500"
                                : "bg-slate-400"
                          }`}
                        />
                        {status === "active"
                          ? "Hoạt động"
                          : status === "expired"
                            ? "Hết hạn"
                            : "Tắt"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <button
                        onClick={() => handleToggleVisible(d)}
                        className={`inline-flex items-center gap-1 rounded-lg px-2 py-1.5 text-xs font-medium transition ${
                          d.isVisible
                            ? "bg-violet-50 text-violet-600 hover:bg-violet-100"
                            : "bg-slate-100 text-slate-400 hover:bg-slate-200"
                        }`}
                        title={d.isVisible ? "Đang hiển thị — bấm để ẩn" : "Đang ẩn — bấm để hiện"}
                      >
                        {d.isVisible ? <Eye size={14} /> : <EyeOff size={14} />}
                      </button>
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-xs text-slate-500">
                        <div>{formatDate(d.startDate)}</div>
                        <div className="text-slate-400">→ {formatDate(d.endDate)}</div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex justify-end gap-1.5">
                        <button
                          onClick={() => handleToggleActive(d)}
                          title={d.isActive ? "Vô hiệu hóa" : "Kích hoạt"}
                          className={`inline-flex h-8 w-8 items-center justify-center rounded-lg transition ${
                            d.isActive
                              ? "text-amber-600 hover:bg-amber-50"
                              : "text-emerald-600 hover:bg-emerald-50"
                          }`}
                        >
                          {d.isActive ? (
                            <ToggleRight size={16} />
                          ) : (
                            <ToggleLeft size={16} />
                          )}
                        </button>
                        <button
                          onClick={() => handleEdit(d)}
                          className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-blue-600 transition hover:bg-blue-50"
                          title="Chỉnh sửa"
                        >
                          <Pencil size={15} />
                        </button>
                        <button
                          onClick={() => setDeleteTarget(d)}
                          className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-red-500 transition hover:bg-red-50"
                          title="Xóa"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : loading ? (
        <div className="flex h-48 items-center justify-center rounded-xl border border-slate-200 bg-slate-50">
          <div className="flex flex-col items-center gap-3">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-emerald-200 border-t-emerald-600" />
            <p className="text-slate-400">Đang tải...</p>
          </div>
        </div>
      ) : (
        <div className="flex h-48 flex-col items-center justify-center rounded-xl border border-slate-200 bg-slate-50">
          <Tag size={32} className="mb-2 text-slate-300" />
          <p className="text-slate-400">Chưa có mã giảm giá nào</p>
          <button
            onClick={handleCreate}
            className="mt-3 text-sm font-medium text-emerald-600 hover:text-emerald-700"
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
          onPageChange={goToPage}
          isLoading={loading}
        />
      )}

      {/* Create/Edit Form Modal */}
      {showForm && (
        <AdminModal
          title={
            editingDiscount ? "Chỉnh sửa mã giảm giá" : "Tạo mã giảm giá mới"
          }
          open={true}
          onClose={handleCloseForm}
        >
          <AdminDiscountForm
            discount={editingDiscount}
            onClose={handleCloseForm}
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

      {/* Toast Notifications */}
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
