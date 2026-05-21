"use client";

import { useState, useEffect, useMemo } from "react";
import { Loader2, X, Tag, Eye, EyeOff } from "lucide-react";
import { discountService } from "@/services/admin/discount.service";
import { Discount, CreateDiscountPayload } from "@/types/discount";

type Props = {
  discount: Discount | null;
  onClose: () => void;
  onSuccess: () => void;
};

const defaultForm: CreateDiscountPayload = {
  name: "",
  percentage: 0,
  minOrderValue: 0,
  maxDiscount: undefined,
  usageLimit: 100,
  startDate: "",
  endDate: "",
  isActive: true,
  isVisible: true,
};

/**
 * Sanitise name for code preview: remove non-alphanumeric, uppercase.
 */
function sanitise(raw: string): string {
  return raw.replace(/[^a-zA-Z0-9]/g, "").toUpperCase();
}

export default function AdminDiscountForm({
  discount,
  onClose,
  onSuccess,
}: Props) {
  const [form, setForm] = useState<CreateDiscountPayload>(defaultForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (discount) {
      setForm({
        name: discount.name || "",
        percentage: discount.percentage,
        minOrderValue: discount.minOrderValue,
        maxDiscount: discount.maxDiscount ?? undefined,
        usageLimit: discount.usageLimit,
        startDate: discount.startDate
          ? discount.startDate.slice(0, 16)
          : "",
        endDate: discount.endDate ? discount.endDate.slice(0, 16) : "",
        isActive: discount.isActive,
        isVisible: discount.isVisible ?? true,
      });
    } else {
      setForm(defaultForm);
    }
  }, [discount]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    const { name, value, type } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]:
        type === "number"
          ? value === ""
            ? ""
            : Number(value)
          : type === "checkbox"
            ? (e.target as HTMLInputElement).checked
            : value,
    }));
  };

  // Live code preview
  const codePreview = useMemo(() => {
    const namePart = sanitise(form.name);
    if (!namePart || !form.percentage) return "";
    return `${namePart}${form.percentage}`;
  }, [form.name, form.percentage]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!form.name.trim()) {
      setError("Vui lòng nhập tên mã giảm giá");
      return;
    }
    if (!form.percentage || form.percentage <= 0 || form.percentage > 100) {
      setError("Phần trăm giảm giá phải từ 1 đến 100");
      return;
    }
    if (!form.startDate || !form.endDate) {
      setError("Vui lòng chọn ngày bắt đầu và kết thúc");
      return;
    }
    const start = new Date(form.startDate);
    const end = new Date(form.endDate);
    if (end <= start) {
      setError("Ngày kết thúc phải lớn hơn ngày bắt đầu");
      return;
    }
    if (!discount && end <= new Date()) {
      setError("Không thể tạo mã đã hết hạn");
      return;
    }

    try {
      setSaving(true);
      const payload: CreateDiscountPayload = {
        ...form,
        name: form.name.trim(),
        startDate: new Date(form.startDate).toISOString(),
        endDate: new Date(form.endDate).toISOString(),
      };

      if (discount) {
        await discountService.updateDiscount(discount.id, payload);
      } else {
        await discountService.createDiscount(payload);
      }
      onSuccess();
      onClose();
    } catch (err: any) {
      const msg =
        err?.response?.data?.message || err?.message || "Lỗi khi lưu mã giảm giá";
      setError(Array.isArray(msg) ? msg.join(", ") : msg);
    } finally {
      setSaving(false);
    }
  };

  const inputClass =
    "w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-800 outline-none transition focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100";

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2.5 text-sm text-rose-700">
          <X size={14} className="shrink-0" />
          {error}
        </div>
      )}

      {/* Code Preview */}
      {codePreview && (
        <div className="flex items-center gap-2 rounded-xl border border-violet-200 bg-violet-50 px-4 py-3">
          <Tag size={16} className="text-violet-600" />
          <div>
            <p className="text-xs text-violet-500">Mã sẽ được tạo:</p>
            <p className="text-lg font-bold tracking-widest text-violet-700">
              {codePreview}
            </p>
          </div>
        </div>
      )}

      {/* Name & Percentage */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">
            Tên mã <span className="text-rose-400">*</span>
          </label>
          <input
            name="name"
            value={form.name}
            onChange={handleChange}
            placeholder="Ví dụ: sale, summer, newuser"
            className={inputClass}
            required
          />
          <p className="mt-1 text-xs text-slate-400">
            Chỉ chữ và số, khoảng trắng sẽ bị loại bỏ
          </p>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">
            Phần trăm giảm giá (%) <span className="text-rose-400">*</span>
          </label>
          <input
            name="percentage"
            type="number"
            value={form.percentage || ""}
            onChange={handleChange}
            min={1}
            max={100}
            placeholder="1 - 100"
            className={inputClass}
            required
          />
        </div>
      </div>

      {/* Min Order Value & Max Discount & Usage Limit */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">
            Đơn tối thiểu (₫) <span className="text-rose-400">*</span>
          </label>
          <input
            name="minOrderValue"
            type="number"
            value={form.minOrderValue || ""}
            onChange={handleChange}
            min={0}
            placeholder="0"
            className={inputClass}
            required
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">
            Giảm tối đa (₫)
          </label>
          <input
            name="maxDiscount"
            type="number"
            value={form.maxDiscount ?? ""}
            onChange={handleChange}
            min={0}
            placeholder="Không giới hạn"
            className={inputClass}
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">
            Số lượt sử dụng <span className="text-rose-400">*</span>
          </label>
          <input
            name="usageLimit"
            type="number"
            value={form.usageLimit || ""}
            onChange={handleChange}
            min={1}
            placeholder="100"
            className={inputClass}
            required
          />
        </div>
      </div>

      {/* Dates */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">
            Ngày bắt đầu <span className="text-rose-400">*</span>
          </label>
          <input
            name="startDate"
            type="datetime-local"
            value={form.startDate}
            onChange={handleChange}
            className={inputClass}
            required
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">
            Ngày kết thúc <span className="text-rose-400">*</span>
          </label>
          <input
            name="endDate"
            type="datetime-local"
            value={form.endDate}
            onChange={handleChange}
            className={inputClass}
            required
          />
        </div>
      </div>

      {/* Toggles */}
      <div className="flex flex-wrap items-center gap-6 rounded-xl border border-slate-200 bg-slate-50 px-5 py-4">
        <label className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer">
          <input
            name="isActive"
            type="checkbox"
            checked={form.isActive}
            onChange={handleChange}
            className="h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
          />
          <span className={form.isActive ? "font-medium text-emerald-700" : "text-slate-500"}>
            Hoạt động
          </span>
        </label>

        <div className="h-6 w-px bg-slate-200" />

        <label className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer">
          <input
            name="isVisible"
            type="checkbox"
            checked={form.isVisible}
            onChange={handleChange}
            className="h-4 w-4 rounded border-slate-300 text-violet-600 focus:ring-violet-500"
          />
          {form.isVisible ? (
            <Eye size={15} className="text-violet-500" />
          ) : (
            <EyeOff size={15} className="text-slate-400" />
          )}
          <span className={form.isVisible ? "font-medium text-violet-700" : "text-slate-500"}>
            Hiển thị trong danh sách gợi ý
          </span>
        </label>
      </div>

      {/* Actions */}
      <div className="flex gap-3 border-t border-slate-200 pt-4">
        <button
          type="button"
          onClick={onClose}
          className="flex-1 rounded-xl border border-slate-300 bg-white py-2.5 text-sm font-medium text-slate-600 transition hover:bg-slate-50"
        >
          Hủy
        </button>
        <button
          type="submit"
          disabled={saving}
          className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-500 py-2.5 text-sm font-semibold text-white shadow-md shadow-emerald-200 transition hover:from-emerald-700 hover:to-emerald-600 disabled:opacity-50"
        >
          {saving ? (
            <>
              <Loader2 size={15} className="animate-spin" />
              Đang lưu...
            </>
          ) : discount ? (
            "Lưu thay đổi"
          ) : (
            "Tạo mã giảm giá"
          )}
        </button>
      </div>
    </form>
  );
}
