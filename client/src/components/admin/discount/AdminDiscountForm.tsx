"use client";

import { useState, useEffect, useMemo } from "react";
import { Loader2, X, Tag, Eye, EyeOff, Infinity, Clock, Users } from "lucide-react";
import { discountService } from "@/services/admin/discount.service";
import { Discount, CreateDiscountPayload } from "@/types/discount";

type Props = {
  discount: Discount | null;
  onClose: () => void;
  onSuccess: () => void;
};

const defaultForm: CreateDiscountPayload & {
  unlimitedUsage: boolean;
  unlimitedTime: boolean;
  unlimitedPerUser: boolean;
} = {
  name: "",
  percentage: 0,
  minOrderValue: 0,
  maxDiscount: undefined,
  usageLimit: 100,
  usageLimitPerUser: undefined,
  startDate: "",
  endDate: "",
  isActive: true,
  isVisible: true,
  unlimitedUsage: false,
  unlimitedTime: false,
  unlimitedPerUser: true,
};

/**
 * Get current datetime in local ISO format for datetime-local input min value.
 */
function getNowLocal(): string {
  const now = new Date();
  const offset = now.getTimezoneOffset();
  const local = new Date(now.getTime() - offset * 60000);
  return local.toISOString().slice(0, 16);
}

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
  const [form, setForm] = useState(defaultForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (discount) {
      const isUnlimitedUsage = discount.usageLimit === null;
      const isUnlimitedTime = discount.startDate === null && discount.endDate === null;
      const isUnlimitedPerUser = discount.usageLimitPerUser === null;

      setForm({
        name: discount.name || "",
        percentage: discount.percentage,
        minOrderValue: discount.minOrderValue,
        maxDiscount: discount.maxDiscount ?? undefined,
        usageLimit: discount.usageLimit ?? 100,
        usageLimitPerUser: discount.usageLimitPerUser ?? undefined,
        startDate: discount.startDate
          ? discount.startDate.slice(0, 16)
          : "",
        endDate: discount.endDate ? discount.endDate.slice(0, 16) : "",
        isActive: discount.isActive,
        isVisible: discount.isVisible ?? true,
        unlimitedUsage: isUnlimitedUsage,
        unlimitedTime: isUnlimitedTime,
        unlimitedPerUser: isUnlimitedPerUser,
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

    // Validate usage limit (if not unlimited)
    if (!form.unlimitedUsage && (!form.usageLimit || Number(form.usageLimit) < 1)) {
      setError("Số lượt sử dụng phải lớn hơn 0");
      return;
    }

    // Validate per-user limit (if not unlimited)
    if (!form.unlimitedPerUser && (!form.usageLimitPerUser || Number(form.usageLimitPerUser) < 1)) {
      setError("Giới hạn sử dụng mỗi user phải lớn hơn 0");
      return;
    }

    // Validate dates (if not unlimited time)
    if (!form.unlimitedTime) {
      if (!form.startDate || !form.endDate) {
        setError("Vui lòng chọn ngày bắt đầu và kết thúc");
        return;
      }
      const start = new Date(form.startDate);
      const end = new Date(form.endDate);
      const now = new Date();
      if (start < now) {
        setError("Ngày bắt đầu không được nhỏ hơn thời gian hiện tại");
        return;
      }
      if (end < now) {
        setError("Ngày kết thúc không được nhỏ hơn thời gian hiện tại");
        return;
      }
      if (end <= start) {
        setError("Ngày kết thúc phải lớn hơn ngày bắt đầu");
        return;
      }
    }

    try {
      setSaving(true);
      const payload: CreateDiscountPayload = {
        name: form.name.trim(),
        percentage: form.percentage,
        minOrderValue: form.minOrderValue ?? 0,
        maxDiscount: form.maxDiscount || undefined,
        usageLimit: form.unlimitedUsage ? null : Number(form.usageLimit),
        usageLimitPerUser: form.unlimitedPerUser ? null : Number(form.usageLimitPerUser),
        startDate: form.unlimitedTime
          ? null
          : new Date(form.startDate!).toISOString(),
        endDate: form.unlimitedTime
          ? null
          : new Date(form.endDate!).toISOString(),
        isActive: form.isActive,
        isVisible: form.isVisible,
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

  const toggleBtnClass = (active: boolean) =>
    `inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-medium transition cursor-pointer border ${
      active
        ? "bg-emerald-50 text-emerald-700 border-emerald-200 ring-1 ring-emerald-100"
        : "bg-slate-50 text-slate-500 border-slate-200 hover:bg-slate-100"
    }`;

  const nowLocal = getNowLocal();

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

      {/* Min Order Value & Max Discount */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">
            Đơn tối thiểu (₫)
          </label>
          <input
            name="minOrderValue"
            type="number"
            value={form.minOrderValue ?? ""}
            onChange={handleChange}
            min={0}
            placeholder="0 = Không yêu cầu"
            className={inputClass}
          />
          <p className="mt-1 text-xs text-slate-400">
            Nhập 0 nếu không yêu cầu đơn tối thiểu
          </p>
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
      </div>

      {/* Usage Limit */}
      <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-4 space-y-3">
        <div className="flex items-center justify-between">
          <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
            <Tag size={14} className="text-emerald-500" />
            Số lượt sử dụng
          </label>
          <button
            type="button"
            onClick={() =>
              setForm((prev) => ({
                ...prev,
                unlimitedUsage: !prev.unlimitedUsage,
              }))
            }
            className={toggleBtnClass(form.unlimitedUsage)}
          >
            <Infinity size={14} />
            {form.unlimitedUsage ? "Không giới hạn" : "Có giới hạn"}
          </button>
        </div>
        {!form.unlimitedUsage && (
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
        )}
      </div>

      {/* Per-user Usage Limit */}
      <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-4 space-y-3">
        <div className="flex items-center justify-between">
          <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
            <Users size={14} className="text-blue-500" />
            Giới hạn sử dụng mỗi user
          </label>
          <button
            type="button"
            onClick={() =>
              setForm((prev) => ({
                ...prev,
                unlimitedPerUser: !prev.unlimitedPerUser,
              }))
            }
            className={toggleBtnClass(form.unlimitedPerUser)}
          >
            <Infinity size={14} />
            {form.unlimitedPerUser ? "Không giới hạn" : "Có giới hạn"}
          </button>
        </div>
        {!form.unlimitedPerUser && (
          <input
            name="usageLimitPerUser"
            type="number"
            value={form.usageLimitPerUser || ""}
            onChange={handleChange}
            min={1}
            placeholder="1"
            className={inputClass}
            required
          />
        )}
      </div>

      {/* Date/Time */}
      <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-4 space-y-3">
        <div className="flex items-center justify-between">
          <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
            <Clock size={14} className="text-amber-500" />
            Thời gian hiệu lực
          </label>
          <button
            type="button"
            onClick={() =>
              setForm((prev) => ({
                ...prev,
                unlimitedTime: !prev.unlimitedTime,
                // Reset dates when toggling
                ...(prev.unlimitedTime
                  ? { startDate: getNowLocal(), endDate: "" }
                  : { startDate: "", endDate: "" }),
              }))
            }
            className={toggleBtnClass(form.unlimitedTime)}
          >
            <Infinity size={14} />
            {form.unlimitedTime ? "Không giới hạn" : "Có thời hạn"}
          </button>
        </div>
        {!form.unlimitedTime && (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-500">
                Ngày bắt đầu <span className="text-rose-400">*</span>
              </label>
              <input
                name="startDate"
                type="datetime-local"
                value={form.startDate || ""}
                onChange={(e) => {
                  const val = e.target.value;
                  setForm((prev) => {
                    const updated = { ...prev, startDate: val };
                    // If end date is before start date, clear it
                    if (prev.endDate && new Date(prev.endDate) <= new Date(val)) {
                      updated.endDate = "";
                    }
                    return updated;
                  });
                }}
                min={nowLocal}
                className={inputClass}
                required
              />
            </div>

            <div>
              <label className="mb-1 block text-xs font-medium text-slate-500">
                Ngày kết thúc <span className="text-rose-400">*</span>
              </label>
              <input
                name="endDate"
                type="datetime-local"
                value={form.endDate || ""}
                onChange={handleChange}
                min={form.startDate || nowLocal}
                className={inputClass}
                required
              />
            </div>
          </div>
        )}
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
