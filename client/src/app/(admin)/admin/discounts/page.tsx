"use client";

import { useState, useEffect, useCallback } from "react";
import { Plus, Trash2, Pencil, Tag, ToggleLeft, ToggleRight } from "lucide-react";
import { SearchBar, Pagination } from "@/components/ui";
import AdminModal from "@/components/admin/ui/admin-modal";
import AdminToast from "@/components/admin/ui/admin-toast";
import ConfirmDialog from "@/components/admin/ui/confirm-dialog";
import AdminDiscountForm from "@/components/admin/discount/AdminDiscountForm";
import { discountService } from "@/services/admin/discount.service";
import { Discount } from "@/types/discount";

const statusColors: Record<string, string> = {
  active: "bg-emerald-50 text-emerald-700 border-emerald-200",
  inactive: "bg-slate-100 text-slate-600 border-slate-200",
  expired: "bg-red-50 text-red-600 border-red-200",
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
        message: "Failed to load discounts",
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
      setToast({ type: "success", message: "Discount deleted successfully" });
      setDeleteTarget(null);
      fetchDiscounts();
    } catch (err) {
      setToast({
        type: "error",
        message:
          err instanceof Error ? err.message : "Failed to delete discount",
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
        message: d.isActive ? "Discount deactivated" : "Discount activated",
      });
      fetchDiscounts();
    } catch (err) {
      setToast({
        type: "error",
        message: "Failed to update status",
      });
    }
  };

  const handleFormSuccess = () => {
    setToast({
      type: "success",
      message: editingDiscount
        ? "Discount updated successfully"
        : "Discount created successfully",
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
            Discount Codes
          </h2>
          <p className="mt-0.5 text-sm text-slate-500">
            {pagination?.totalResults?.toLocaleString() || 0} total coupons
          </p>
        </div>
        <button
          onClick={handleCreate}
          className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-500 px-4 py-2.5 text-sm font-semibold text-white shadow-md shadow-emerald-200 transition hover:from-emerald-700 hover:to-emerald-600"
        >
          <Plus size={16} />
          Add Coupon
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
            placeholder="Search coupons…"
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
          <option value="">All Statuses</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
      </div>

      {/* Discounts Table */}
      {!loading && discounts.length > 0 ? (
        <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
          <table className="w-full">
            <thead className="border-b border-slate-200 bg-slate-50">
              <tr className="text-sm font-semibold text-slate-700">
                <th className="px-5 py-3 text-left">Code</th>
                <th className="px-5 py-3 text-left">Type</th>
                <th className="px-5 py-3 text-right">Value</th>
                <th className="px-5 py-3 text-right">Min Order</th>
                <th className="px-5 py-3 text-center">Usage</th>
                <th className="px-5 py-3 text-center">Status</th>
                <th className="px-5 py-3 text-left">Period</th>
                <th className="px-5 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {discounts.map((d) => {
                const status = getDiscountStatus(d);
                return (
                  <tr key={d.id} className="transition hover:bg-slate-50">
                    <td className="px-5 py-3">
                      <span className="inline-flex items-center gap-1.5 rounded-lg bg-violet-50 px-2.5 py-1 text-sm font-bold text-violet-700 tracking-wide">
                        <Tag size={12} />
                        {d.code}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-sm text-slate-600 capitalize">
                      {d.type}
                    </td>
                    <td className="px-5 py-3 text-right text-sm font-semibold text-slate-800">
                      {d.type === "percentage"
                        ? `${d.value}%`
                        : `${formatMoney(d.value)} ₫`}
                      {d.maxDiscount ? (
                        <span className="block text-xs font-normal text-slate-400">
                          max {formatMoney(d.maxDiscount)} ₫
                        </span>
                      ) : null}
                    </td>
                    <td className="px-5 py-3 text-right text-sm text-slate-600">
                      {formatMoney(d.minOrderValue)} ₫
                    </td>
                    <td className="px-5 py-3 text-center text-sm">
                      <span className="font-semibold text-slate-800">
                        {d.usedCount}
                      </span>
                      <span className="text-slate-400">/{d.usageLimit}</span>
                    </td>
                    <td className="px-5 py-3 text-center">
                      <span
                        className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${
                          statusColors[status] || statusColors.inactive
                        }`}
                      >
                        {status === "active"
                          ? "Active"
                          : status === "expired"
                            ? "Expired"
                            : "Inactive"}
                      </span>
                    </td>
                    <td className="px-5 py-3">
                      <div className="text-xs text-slate-500">
                        <div>{formatDate(d.startDate)}</div>
                        <div className="text-slate-400">→ {formatDate(d.endDate)}</div>
                      </div>
                    </td>
                    <td className="px-5 py-3 text-right">
                      <div className="flex justify-end gap-1.5">
                        <button
                          onClick={() => handleToggleActive(d)}
                          title={d.isActive ? "Deactivate" : "Activate"}
                          className={`inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-sm font-medium transition ${
                            d.isActive
                              ? "bg-amber-50 text-amber-600 hover:bg-amber-100"
                              : "bg-emerald-50 text-emerald-600 hover:bg-emerald-100"
                          }`}
                        >
                          {d.isActive ? (
                            <ToggleRight size={14} />
                          ) : (
                            <ToggleLeft size={14} />
                          )}
                        </button>
                        <button
                          onClick={() => handleEdit(d)}
                          className="inline-flex items-center gap-1 rounded-lg bg-blue-50 px-2.5 py-1.5 text-sm font-medium text-blue-600 transition hover:bg-blue-100"
                        >
                          <Pencil size={14} />
                        </button>
                        <button
                          onClick={() => setDeleteTarget(d)}
                          className="inline-flex items-center gap-1 rounded-lg bg-red-50 px-2.5 py-1.5 text-sm font-medium text-red-600 transition hover:bg-red-100"
                        >
                          <Trash2 size={14} />
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
            <p className="text-slate-400">Loading discounts...</p>
          </div>
        </div>
      ) : (
        <div className="flex h-48 flex-col items-center justify-center rounded-xl border border-slate-200 bg-slate-50">
          <Tag size={32} className="mb-2 text-slate-300" />
          <p className="text-slate-400">No discount codes found</p>
          <button
            onClick={handleCreate}
            className="mt-3 text-sm font-medium text-emerald-600 hover:text-emerald-700"
          >
            Create your first coupon →
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
            editingDiscount ? "Edit Discount Code" : "Create New Discount Code"
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
          title="Delete Discount Code"
          description={`Are you sure you want to delete coupon "${deleteTarget.code}"? This action cannot be undone.`}
          confirmLabel="Delete"
          cancelLabel="Cancel"
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
