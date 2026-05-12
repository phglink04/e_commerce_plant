"use client";

import { useState } from "react";
import {
  MapPin,
  Plus,
  Edit3,
  Trash2,
  Star,
  CheckCircle2,
  AlertTriangle,
  Loader2,
} from "lucide-react";
import { useAddresses } from "@/hooks/useProfile";
import AddressForm from "./AddressForm";
import type { Address } from "@/types";

export default function AddressList() {
  const {
    addresses,
    loading,
    submitting,
    createAddress,
    updateAddress,
    deleteAddress,
  } = useAddresses();

  const [showForm, setShowForm] = useState(false);
  const [editingAddress, setEditingAddress] = useState<Address | null>(null);
  const [toast, setToast] = useState("");
  const [toastType, setToastType] = useState<"success" | "error">("success");
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const showToast = (msg: string, type: "success" | "error" = "success") => {
    setToast(msg);
    setToastType(type);
    setTimeout(() => setToast(""), 3000);
  };

  const handleCreate = async (data: any) => {
    try {
      await createAddress(data);
      setShowForm(false);
      showToast("Address added successfully");
    } catch {
      showToast("Failed to add address", "error");
    }
  };

  const handleUpdate = async (data: any) => {
    if (!editingAddress) return;
    try {
      await updateAddress(editingAddress.id, data);
      setEditingAddress(null);
      showToast("Address updated successfully");
    } catch {
      showToast("Failed to update address", "error");
    }
  };

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    try {
      await deleteAddress(id);
      showToast("Address deleted");
    } catch {
      showToast("Failed to delete address", "error");
    } finally {
      setDeletingId(null);
    }
  };

  const handleSetDefault = async (address: Address) => {
    try {
      await updateAddress(address.id, { isDefault: true });
      showToast("Default address updated");
    } catch {
      showToast("Failed to set default", "error");
    }
  };

  if (loading) {
    return (
      <div className="pf-skeleton-wrap">
        {[1, 2].map((i) => (
          <div key={i} className="pf-skeleton pf-skeleton--card" />
        ))}
      </div>
    );
  }

  return (
    <div className="pf-addresses" id="address-list">
      {toast && (
        <div className={`pf-toast pf-toast--${toastType}`} role="alert">
          <CheckCircle2 size={18} />
          <span>{toast}</span>
        </div>
      )}

      {/* Add Button */}
      {!showForm && !editingAddress && (
        <button
          onClick={() => setShowForm(true)}
          className="pf-btn pf-btn--primary pf-addresses__add-btn"
          id="add-address-btn"
        >
          <Plus size={18} />
          Add New Address
        </button>
      )}

      {/* Add Form */}
      {showForm && (
        <div className="pf-addresses__form-wrap">
          <AddressForm
            onSubmit={handleCreate}
            onCancel={() => setShowForm(false)}
            submitting={submitting}
          />
        </div>
      )}

      {/* Edit Form */}
      {editingAddress && (
        <div className="pf-addresses__form-wrap">
          <AddressForm
            address={editingAddress}
            onSubmit={handleUpdate}
            onCancel={() => setEditingAddress(null)}
            submitting={submitting}
          />
        </div>
      )}

      {/* Address List */}
      {addresses.length === 0 && !showForm ? (
        <div className="pf-empty">
          <MapPin size={48} />
          <h3>No addresses yet</h3>
          <p>Add a shipping address to get started.</p>
        </div>
      ) : (
        <div className="pf-addresses__grid">
          {addresses.map((addr) => (
            <div
              key={addr.id}
              className={`pf-address-card ${addr.isDefault ? "pf-address-card--default" : ""}`}
              id={`address-${addr.id}`}
            >
              {addr.isDefault && (
                <span className="pf-address-card__badge">
                  <Star size={12} />
                  Default
                </span>
              )}

              <div className="pf-address-card__info">
                <p className="pf-address-card__name">{addr.fullName}</p>
                <p className="pf-address-card__phone">{addr.phone}</p>
                <p className="pf-address-card__line">{addr.addressLine}</p>
                <p className="pf-address-card__region">
                  {addr.ward}, {addr.district}, {addr.city}
                </p>
              </div>

              <div className="pf-address-card__actions">
                {!addr.isDefault && (
                  <button
                    onClick={() => handleSetDefault(addr)}
                    className="pf-btn pf-btn--ghost pf-btn--sm"
                    disabled={submitting}
                  >
                    <Star size={14} />
                    Set Default
                  </button>
                )}
                <button
                  onClick={() => {
                    setShowForm(false);
                    setEditingAddress(addr);
                  }}
                  className="pf-btn pf-btn--ghost pf-btn--sm"
                  disabled={submitting}
                >
                  <Edit3 size={14} />
                  Edit
                </button>
                <button
                  onClick={() => handleDelete(addr.id)}
                  className="pf-btn pf-btn--ghost pf-btn--sm pf-btn--danger-text"
                  disabled={deletingId === addr.id}
                >
                  {deletingId === addr.id ? (
                    <Loader2 size={14} className="pf-spin" />
                  ) : (
                    <Trash2 size={14} />
                  )}
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
