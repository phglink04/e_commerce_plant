"use client";

import { useEffect, useMemo, useState } from "react";
import { ChevronDown } from "lucide-react";
import { useVnAddress } from "@/hooks/useVnAddress";
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

  const {
    provinces,
    districts,
    wards,
    loadingProvinces,
    loadingDistricts,
    loadingWards,
    fetchDistricts,
    fetchWards,
    findProvinceCode,
    findDistrictCode,
  } = useVnAddress();

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

  /* ── Hydrate dropdowns for edit mode ── */
  useEffect(() => {
    if (form.city && provinces.length > 0) {
      const code = findProvinceCode(form.city);
      if (code) fetchDistricts(code);
    }
  }, [form.city, provinces, findProvinceCode, fetchDistricts]);

  useEffect(() => {
    if (form.district && districts.length > 0) {
      const code = findDistrictCode(form.district);
      if (code) fetchWards(code);
    }
  }, [form.district, districts, findDistrictCode, fetchWards]);

  /* ── Handlers ── */
  const handleProvinceChange = (name: string) => {
    setForm((prev) => ({ ...prev, city: name, district: "", ward: "" }));
    const code = provinces.find((p) => p.name === name)?.code ?? 0;
    fetchDistricts(code);
  };

  const handleDistrictChange = (name: string) => {
    setForm((prev) => ({ ...prev, district: name, ward: "" }));
    const code = districts.find((d) => d.name === name)?.code ?? 0;
    fetchWards(code);
  };

  const handleWardChange = (name: string) => {
    setForm((prev) => ({ ...prev, ward: name }));
  };

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
      nextErrors.fullName = "Họ tên là bắt buộc.";
    }

    if (!form.phone.trim()) {
      nextErrors.phone = "Số điện thoại là bắt buộc.";
    } else if (!/^\+?[0-9\s-]{8,15}$/.test(form.phone.trim())) {
      nextErrors.phone = "Số điện thoại không hợp lệ.";
    }

    if (!form.city.trim()) {
      nextErrors.city = "Vui lòng chọn Tỉnh/Thành phố.";
    }

    if (!form.district.trim()) {
      nextErrors.district = "Vui lòng chọn Quận/Huyện.";
    }

    if (!form.ward.trim()) {
      nextErrors.ward = "Vui lòng chọn Phường/Xã.";
    }

    if (!form.addressLine.trim()) {
      nextErrors.addressLine = "Địa chỉ chi tiết là bắt buộc.";
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  if (!open) {
    return null;
  }

  const selectClass =
    "w-full appearance-none rounded-xl border border-slate-200 px-3 py-2 pr-9 text-sm outline-none transition focus:border-emerald-400 bg-white disabled:bg-slate-50 disabled:text-slate-400";

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
            Đóng
          </button>
        </header>

        <div className="space-y-3">
          {/* Họ tên */}
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">
              Họ và tên
            </label>
            <input
              value={form.fullName}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, fullName: event.target.value }))
              }
              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none transition focus:border-emerald-400"
              placeholder="Nguyễn Văn A"
            />
            {errors.fullName ? (
              <p className="mt-1 text-xs text-rose-600">{errors.fullName}</p>
            ) : null}
          </div>

          {/* Số điện thoại */}
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">
              Số điện thoại
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

          {/* Tỉnh / Thành phố */}
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">
              Tỉnh / Thành phố
            </label>
            <div className="relative">
              <select
                value={form.city}
                onChange={(e) => handleProvinceChange(e.target.value)}
                className={selectClass}
                disabled={loadingProvinces}
              >
                <option value="">
                  {loadingProvinces ? "Đang tải..." : "-- Chọn Tỉnh/Thành phố --"}
                </option>
                {provinces.map((p) => (
                  <option key={p.code} value={p.name}>{p.name}</option>
                ))}
              </select>
              <ChevronDown size={15} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
            </div>
            {errors.city ? (
              <p className="mt-1 text-xs text-rose-600">{errors.city}</p>
            ) : null}
          </div>

          {/* Quận / Huyện */}
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">
              Quận / Huyện
            </label>
            <div className="relative">
              <select
                value={form.district}
                onChange={(e) => handleDistrictChange(e.target.value)}
                className={selectClass}
                disabled={!form.city || loadingDistricts}
              >
                <option value="">
                  {loadingDistricts
                    ? "Đang tải..."
                    : !form.city
                      ? "-- Chọn Tỉnh/TP trước --"
                      : "-- Chọn Quận/Huyện --"}
                </option>
                {districts.map((d) => (
                  <option key={d.code} value={d.name}>{d.name}</option>
                ))}
              </select>
              <ChevronDown size={15} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
            </div>
            {errors.district ? (
              <p className="mt-1 text-xs text-rose-600">{errors.district}</p>
            ) : null}
          </div>

          {/* Phường / Xã */}
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">
              Phường / Xã
            </label>
            <div className="relative">
              <select
                value={form.ward}
                onChange={(e) => handleWardChange(e.target.value)}
                className={selectClass}
                disabled={!form.district || loadingWards}
              >
                <option value="">
                  {loadingWards
                    ? "Đang tải..."
                    : !form.district
                      ? "-- Chọn Quận/Huyện trước --"
                      : "-- Chọn Phường/Xã --"}
                </option>
                {wards.map((w) => (
                  <option key={w.code} value={w.name}>{w.name}</option>
                ))}
              </select>
              <ChevronDown size={15} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
            </div>
            {errors.ward ? (
              <p className="mt-1 text-xs text-rose-600">{errors.ward}</p>
            ) : null}
          </div>

          {/* Địa chỉ chi tiết */}
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">
              Địa chỉ chi tiết
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
              placeholder="Số nhà, tên đường, tòa nhà..."
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
            Hủy
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
            Lưu địa chỉ
          </button>
        </footer>
      </section>
    </div>
  );
}
