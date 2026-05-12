"use client";

import { useState } from "react";
import { Save, X, Loader2 } from "lucide-react";
import type { Address } from "@/types";

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!fullName.trim() || !phone.trim() || !city.trim() || !addressLine.trim()) {
      setError("Please fill in all required fields");
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
        <h3>{address ? "Edit Address" : "Add New Address"}</h3>
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
            Full Name *
          </label>
          <input
            id="addr-fullName"
            type="text"
            className="pf-form__input"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder="Recipient's full name"
            required
          />
        </div>

        <div className="pf-form__group">
          <label htmlFor="addr-phone" className="pf-form__label">
            Phone Number *
          </label>
          <input
            id="addr-phone"
            type="tel"
            className="pf-form__input"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="e.g. 0912 345 678"
            required
          />
        </div>

        <div className="pf-form__group">
          <label htmlFor="addr-city" className="pf-form__label">
            City / Province *
          </label>
          <input
            id="addr-city"
            type="text"
            className="pf-form__input"
            value={city}
            onChange={(e) => setCity(e.target.value)}
            placeholder="e.g. Hồ Chí Minh"
            required
          />
        </div>

        <div className="pf-form__group">
          <label htmlFor="addr-district" className="pf-form__label">
            District
          </label>
          <input
            id="addr-district"
            type="text"
            className="pf-form__input"
            value={district}
            onChange={(e) => setDistrict(e.target.value)}
            placeholder="e.g. Quận 1"
          />
        </div>

        <div className="pf-form__group">
          <label htmlFor="addr-ward" className="pf-form__label">
            Ward
          </label>
          <input
            id="addr-ward"
            type="text"
            className="pf-form__input"
            value={ward}
            onChange={(e) => setWard(e.target.value)}
            placeholder="e.g. Phường Bến Nghé"
          />
        </div>

        <div className="pf-form__group pf-form__group--full">
          <label htmlFor="addr-line" className="pf-form__label">
            Address Line *
          </label>
          <input
            id="addr-line"
            type="text"
            className="pf-form__input"
            value={addressLine}
            onChange={(e) => setAddressLine(e.target.value)}
            placeholder="Street, house number, etc."
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
            <span>Set as default address</span>
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
          Cancel
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
              Saving…
            </>
          ) : (
            <>
              <Save size={16} />
              {address ? "Update Address" : "Add Address"}
            </>
          )}
        </button>
      </div>
    </form>
  );
}
