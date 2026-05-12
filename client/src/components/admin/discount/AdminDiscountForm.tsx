"use client";

import { useState, useEffect } from "react";
import { discountService } from "@/services/admin/discount.service";
import { Discount, CreateDiscountPayload } from "@/types/discount";

type Props = {
  discount: Discount | null;
  onClose: () => void;
  onSuccess: () => void;
};

const defaultForm: CreateDiscountPayload = {
  code: "",
  type: "percentage",
  value: 0,
  minOrderValue: 0,
  maxDiscount: undefined,
  usageLimit: 100,
  startDate: "",
  endDate: "",
  isActive: true,
  applicableCategories: [],
  applicableProducts: [],
};

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
        code: discount.code,
        type: discount.type,
        value: discount.value,
        minOrderValue: discount.minOrderValue,
        maxDiscount: discount.maxDiscount ?? undefined,
        usageLimit: discount.usageLimit,
        startDate: discount.startDate
          ? discount.startDate.slice(0, 16)
          : "",
        endDate: discount.endDate ? discount.endDate.slice(0, 16) : "",
        isActive: discount.isActive,
        applicableCategories: discount.applicableCategories ?? [],
        applicableProducts: discount.applicableProducts ?? [],
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!form.code.trim()) {
      setError("Code is required");
      return;
    }
    if (!form.startDate || !form.endDate) {
      setError("Start date and end date are required");
      return;
    }

    try {
      setSaving(true);
      const payload: CreateDiscountPayload = {
        ...form,
        code: form.code.trim().toUpperCase(),
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
      setError(
        err?.message || "Failed to save discount",
      );
    } finally {
      setSaving(false);
    }
  };

  const inputClass =
    "w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-800 outline-none transition focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100";

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <p className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
          {error}
        </p>
      )}

      {/* Code & Type */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">
            Coupon Code *
          </label>
          <input
            name="code"
            value={form.code}
            onChange={handleChange}
            placeholder="e.g. SALE50"
            className={`${inputClass} uppercase`}
            required
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">
            Discount Type *
          </label>
          <select
            name="type"
            value={form.type}
            onChange={handleChange}
            className={inputClass}
          >
            <option value="percentage">Percentage (%)</option>
            <option value="fixed">Fixed Amount (VND)</option>
          </select>
        </div>
      </div>

      {/* Value & Min Order */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">
            Value * {form.type === "percentage" ? "(%)" : "(VND)"}
          </label>
          <input
            name="value"
            type="number"
            value={form.value}
            onChange={handleChange}
            min={0}
            max={form.type === "percentage" ? 100 : undefined}
            className={inputClass}
            required
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">
            Min Order Value (VND) *
          </label>
          <input
            name="minOrderValue"
            type="number"
            value={form.minOrderValue}
            onChange={handleChange}
            min={0}
            className={inputClass}
            required
          />
        </div>
      </div>

      {/* Max Discount & Usage Limit */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">
            Max Discount (VND)
          </label>
          <input
            name="maxDiscount"
            type="number"
            value={form.maxDiscount ?? ""}
            onChange={handleChange}
            min={0}
            placeholder="No limit"
            className={inputClass}
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">
            Usage Limit *
          </label>
          <input
            name="usageLimit"
            type="number"
            value={form.usageLimit}
            onChange={handleChange}
            min={1}
            className={inputClass}
            required
          />
        </div>
      </div>

      {/* Dates */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">
            Start Date *
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
            End Date *
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

      {/* Active Toggle */}
      <label className="flex items-center gap-2 text-sm text-slate-700">
        <input
          name="isActive"
          type="checkbox"
          checked={form.isActive}
          onChange={handleChange}
          className="h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
        />
        Active
      </label>

      {/* Actions */}
      <div className="flex justify-end gap-3 pt-2">
        <button
          type="button"
          onClick={onClose}
          className="rounded-xl border border-slate-200 px-5 py-2.5 text-sm font-medium text-slate-600 transition hover:bg-slate-50"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={saving}
          className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-500 px-5 py-2.5 text-sm font-semibold text-white shadow-md shadow-emerald-200 transition hover:from-emerald-700 hover:to-emerald-600 disabled:opacity-50"
        >
          {saving
            ? "Saving..."
            : discount
              ? "Update Discount"
              : "Create Discount"}
        </button>
      </div>
    </form>
  );
}
