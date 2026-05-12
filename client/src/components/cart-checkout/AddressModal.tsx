"use client";

import { useEffect, useMemo, useState } from "react";
import type { Address } from "./types";

type AddressModalProps = {
  open: boolean;
  title: string;
  initialAddress: Address | null;
  onClose: () => void;
  onSave: (payload: Omit<Address, "id">) => void;
};

type FormState = {
  fullName: string;
  phone: string;
  city: string;
  district: string;
  ward: string;
  addressLine: string;
};

const emptyForm: FormState = {
  fullName: "",
  phone: "",
  city: "",
  district: "",
  ward: "",
  addressLine: "",
};

export default function AddressModal({
  open,
  title,
  initialAddress,
  onClose,
  onSave,
}: AddressModalProps) {
  const [form, setForm] = useState<FormState>(emptyForm);
  const [errors, setErrors] = useState<Partial<FormState>>({});

  useEffect(() => {
    if (!open) {
      return;
    }

    if (initialAddress) {
      setForm({
        fullName: initialAddress.fullName,
        phone: initialAddress.phone,
        city: initialAddress.city ?? "",
        district: initialAddress.district ?? "",
        ward: initialAddress.ward ?? "",
        addressLine: initialAddress.addressLine,
      });
      setErrors({});
      return;
    }

    setForm(emptyForm);
    setErrors({});
  }, [initialAddress, open]);

  const canSubmit = useMemo(
    () =>
      form.fullName.trim().length > 0 &&
      form.phone.trim().length > 0 &&
      form.city.trim().length > 0 &&
      form.district.trim().length > 0 &&
      form.ward.trim().length > 0 &&
      form.addressLine.trim().length > 0,
    [
      form.addressLine,
      form.city,
      form.district,
      form.fullName,
      form.phone,
      form.ward,
    ],
  );

  const validate = (): boolean => {
    const nextErrors: Partial<FormState> = {};

    if (!form.fullName.trim()) {
      nextErrors.fullName = "Full name is required.";
    }

    if (!form.phone.trim()) {
      nextErrors.phone = "Phone is required.";
    } else if (!/^\+?[0-9\s-]{8,15}$/.test(form.phone.trim())) {
      nextErrors.phone = "Phone format is invalid.";
    }

    if (!form.addressLine.trim()) {
      nextErrors.addressLine = "Address detail is required.";
    }

    if (!form.city.trim()) {
      nextErrors.city = "City is required.";
    }

    if (!form.district.trim()) {
      nextErrors.district = "District is required.";
    }

    if (!form.ward.trim()) {
      nextErrors.ward = "Ward is required.";
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      <div
        className="absolute inset-0 bg-black/45 backdrop-blur-[2px]"
        onClick={onClose}
      />

      <section className="relative z-10 w-full max-w-lg origin-center rounded-2xl bg-white p-5 shadow-2xl ring-1 ring-black/5 transition duration-200 animate-in fade-in zoom-in-95 md:p-6">
        <header className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-slate-900">{title}</h3>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg px-2 py-1 text-sm text-slate-500 transition hover:bg-slate-100"
          >
            Close
          </button>
        </header>

        <div className="space-y-3">
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">
              Full name
            </label>
            <input
              value={form.fullName}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, fullName: event.target.value }))
              }
              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none transition focus:border-emerald-400"
              placeholder="Nguyen Van A"
            />
            {errors.fullName ? (
              <p className="mt-1 text-xs text-rose-600">{errors.fullName}</p>
            ) : null}
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">
              Phone number
            </label>
            <input
              value={form.phone}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, phone: event.target.value }))
              }
              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none transition focus:border-emerald-400"
              placeholder="0901234567"
            />
            {errors.phone ? (
              <p className="mt-1 text-xs text-rose-600">{errors.phone}</p>
            ) : null}
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">
              City
            </label>
            <input
              value={form.city}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, city: event.target.value }))
              }
              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none transition focus:border-emerald-400"
              placeholder="Ho Chi Minh City"
            />
            {errors.city ? (
              <p className="mt-1 text-xs text-rose-600">{errors.city}</p>
            ) : null}
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">
              District
            </label>
            <input
              value={form.district}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, district: event.target.value }))
              }
              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none transition focus:border-emerald-400"
              placeholder="District 1"
            />
            {errors.district ? (
              <p className="mt-1 text-xs text-rose-600">{errors.district}</p>
            ) : null}
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">
              Ward
            </label>
            <input
              value={form.ward}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, ward: event.target.value }))
              }
              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none transition focus:border-emerald-400"
              placeholder="Ward 6"
            />
            {errors.ward ? (
              <p className="mt-1 text-xs text-rose-600">{errors.ward}</p>
            ) : null}
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">
              Address detail
            </label>
            <textarea
              value={form.addressLine}
              onChange={(event) =>
                setForm((prev) => ({
                  ...prev,
                  addressLine: event.target.value,
                }))
              }
              rows={3}
              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none transition focus:border-emerald-400"
              placeholder="123 Nguyen Trai, District 5, Ho Chi Minh City"
            />
            {errors.addressLine ? (
              <p className="mt-1 text-xs text-rose-600">{errors.addressLine}</p>
            ) : null}
          </div>
        </div>

        <footer className="mt-5 flex flex-wrap justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={!canSubmit}
            onClick={() => {
              if (!validate()) {
                return;
              }

              onSave({
                fullName: form.fullName.trim(),
                phone: form.phone.trim(),
                city: form.city.trim(),
                district: form.district.trim(),
                ward: form.ward.trim(),
                addressLine: form.addressLine.trim(),
              });
            }}
            className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Save
          </button>
        </footer>
      </section>
    </div>
  );
}
