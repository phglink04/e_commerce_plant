"use client";

import { useEffect, useState } from "react";
import { Save, X, Loader2, ChevronDown } from "lucide-react";
import type { Address } from "@/types";
import { useVnAddress } from "@/hooks/useVnAddress";

interface AddressFormProps {
  address?: Address | null;
  onSubmit: (data: {
    fullName: string;
    phone: string;
    city: string;
    district: string;
    ward: string;
    addressLine: string;
    isDefault?: boolean;
  }) => Promise<void>;
  onCancel: () => void;
  submitting: boolean;
}

export default function AddressForm({
  address,
  onSubmit,
  onCancel,
  submitting,
}: AddressFormProps) {
  const [fullName, setFullName] = useState(address?.fullName || "");
  const [phone, setPhone] = useState(address?.phone || "");
  const [city, setCity] = useState(address?.city || "");
  const [district, setDistrict] = useState(address?.district || "");
  const [ward, setWard] = useState(address?.ward || "");
  const [addressLine, setAddressLine] = useState(address?.addressLine || "");
  const [isDefault, setIsDefault] = useState(address?.isDefault || false);
  const [error, setError] = useState("");

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

  /* ── Hydrate dropdowns when editing an existing address ── */
  useEffect(() => {
    if (address?.city && provinces.length > 0) {
      const code = findProvinceCode(address.city);
      if (code) fetchDistricts(code);
    }
  }, [address?.city, provinces, findProvinceCode, fetchDistricts]);

  useEffect(() => {
    if (address?.district && districts.length > 0) {
      const code = findDistrictCode(address.district);
      if (code) fetchWards(code);
    }
  }, [address?.district, districts, findDistrictCode, fetchWards]);

  /* ── Handlers ── */
  const handleProvinceChange = (name: string) => {
    setCity(name);
    setDistrict("");
    setWard("");
    const code = provinces.find((p) => p.name === name)?.code ?? 0;
    fetchDistricts(code);
  };

  const handleDistrictChange = (name: string) => {
    setDistrict(name);
    setWard("");
    const code = districts.find((d) => d.name === name)?.code ?? 0;
    fetchWards(code);
  };

  const handleWardChange = (name: string) => {
    setWard(name);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!fullName.trim() || !phone.trim() || !city.trim() || !addressLine.trim()) {
      setError("Vui lòng điền đầy đủ các trường bắt buộc");
      return;
    }

    await onSubmit({
      fullName: fullName.trim(),
      phone: phone.trim(),
      city: city.trim(),
      district: district.trim(),
      ward: ward.trim(),
      addressLine: addressLine.trim(),
      isDefault,
    });
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="pf-address-form"
      id="address-form"
    >
      <div className="pf-address-form__header">
        <h3>{address ? "Chỉnh sửa địa chỉ" : "Thêm địa chỉ mới"}</h3>
        <button
          type="button"
          onClick={onCancel}
          className="pf-address-form__close"
        >
          <X size={18} />
        </button>
      </div>

      {error && (
        <div className="pf-alert pf-alert--error">{error}</div>
      )}

      <div className="pf-address-form__grid">
        <div className="pf-form__group">
          <label htmlFor="addr-fullName" className="pf-form__label">
            Họ và tên *
          </label>
          <input
            id="addr-fullName"
            type="text"
            className="pf-form__input"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder="Nguyễn Văn A"
            required
          />
        </div>

        <div className="pf-form__group">
          <label htmlFor="addr-phone" className="pf-form__label">
            Số điện thoại *
          </label>
          <input
            id="addr-phone"
            type="tel"
            className="pf-form__input"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="0912 345 678"
            required
          />
        </div>

        {/* ── Tỉnh / Thành phố ── */}
        <div className="pf-form__group">
          <label htmlFor="addr-city" className="pf-form__label">
            Tỉnh / Thành phố *
          </label>
          <div className="pf-select-wrap">
            <select
              id="addr-city"
              className="pf-form__input pf-form__select"
              value={city}
              onChange={(e) => handleProvinceChange(e.target.value)}
              required
              disabled={loadingProvinces}
            >
              <option value="">
                {loadingProvinces ? "Đang tải..." : "-- Chọn Tỉnh/Thành phố --"}
              </option>
              {provinces.map((p) => (
                <option key={p.code} value={p.name}>
                  {p.name}
                </option>
              ))}
            </select>
            <ChevronDown size={16} className="pf-select-icon" />
          </div>
        </div>

        {/* ── Quận / Huyện ── */}
        <div className="pf-form__group">
          <label htmlFor="addr-district" className="pf-form__label">
            Quận / Huyện *
          </label>
          <div className="pf-select-wrap">
            <select
              id="addr-district"
              className="pf-form__input pf-form__select"
              value={district}
              onChange={(e) => handleDistrictChange(e.target.value)}
              disabled={!city || loadingDistricts}
            >
              <option value="">
                {loadingDistricts
                  ? "Đang tải..."
                  : !city
                    ? "-- Chọn Tỉnh/TP trước --"
                    : "-- Chọn Quận/Huyện --"}
              </option>
              {districts.map((d) => (
                <option key={d.code} value={d.name}>
                  {d.name}
                </option>
              ))}
            </select>
            <ChevronDown size={16} className="pf-select-icon" />
          </div>
        </div>

        {/* ── Phường / Xã ── */}
        <div className="pf-form__group">
          <label htmlFor="addr-ward" className="pf-form__label">
            Phường / Xã
          </label>
          <div className="pf-select-wrap">
            <select
              id="addr-ward"
              className="pf-form__input pf-form__select"
              value={ward}
              onChange={(e) => handleWardChange(e.target.value)}
              disabled={!district || loadingWards}
            >
              <option value="">
                {loadingWards
                  ? "Đang tải..."
                  : !district
                    ? "-- Chọn Quận/Huyện trước --"
                    : "-- Chọn Phường/Xã --"}
              </option>
              {wards.map((w) => (
                <option key={w.code} value={w.name}>
                  {w.name}
                </option>
              ))}
            </select>
            <ChevronDown size={16} className="pf-select-icon" />
          </div>
        </div>

        {/* ── Địa chỉ chi tiết ── */}
        <div className="pf-form__group pf-form__group--full">
          <label htmlFor="addr-line" className="pf-form__label">
            Địa chỉ chi tiết *
          </label>
          <input
            id="addr-line"
            type="text"
            className="pf-form__input"
            value={addressLine}
            onChange={(e) => setAddressLine(e.target.value)}
            placeholder="Số nhà, tên đường, tòa nhà..."
            required
          />
        </div>

        <div className="pf-form__group pf-form__group--full">
          <label className="pf-checkbox">
            <input
              type="checkbox"
              checked={isDefault}
              onChange={(e) => setIsDefault(e.target.checked)}
            />
            <span className="pf-checkbox__mark" />
            <span>Đặt làm địa chỉ mặc định</span>
          </label>
        </div>
      </div>

      <div className="pf-address-form__actions">
        <button
          type="button"
          onClick={onCancel}
          className="pf-btn pf-btn--ghost"
          disabled={submitting}
        >
          Hủy
        </button>
        <button
          type="submit"
          className="pf-btn pf-btn--primary"
          disabled={submitting}
          id="save-address-btn"
        >
          {submitting ? (
            <>
              <Loader2 size={16} className="pf-spin" />
              Đang lưu…
            </>
          ) : (
            <>
              <Save size={16} />
              {address ? "Cập nhật" : "Thêm địa chỉ"}
            </>
          )}
        </button>
      </div>
    </form>
  );
}
