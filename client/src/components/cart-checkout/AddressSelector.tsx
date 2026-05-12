"use client";

import type { Address } from "./types";

type AddressSelectorProps = {
  addresses: Address[];
  selectedAddressId: string | null;
  onSelect: (id: string) => void;
  onAdd: () => void;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
};

export default function AddressSelector({
  addresses,
  selectedAddressId,
  onSelect,
  onAdd,
  onEdit,
  onDelete,
}: AddressSelectorProps) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="mb-3 flex items-center justify-between gap-2">
        <h3 className="text-base font-semibold text-slate-900">
          Shipping Address
        </h3>
        <button
          type="button"
          onClick={onAdd}
          className="rounded-lg border border-emerald-200 px-3 py-1.5 text-xs font-semibold text-emerald-700 transition hover:bg-emerald-50"
        >
          Add New Address
        </button>
      </div>

      {addresses.length === 0 ? (
        <p className="rounded-xl border border-dashed border-slate-300 bg-slate-50 px-3 py-4 text-sm text-slate-500">
          No saved addresses yet. Add your first shipping address.
        </p>
      ) : (
        <div className="space-y-2">
          {addresses.map((address) => {
            const checked = selectedAddressId === address.id;

            return (
              <label
                key={address.id}
                className={`flex cursor-pointer items-start gap-3 rounded-xl border p-3 transition ${
                  checked
                    ? "border-emerald-300 bg-emerald-50/70"
                    : "border-slate-200 bg-white hover:border-slate-300"
                }`}
              >
                <input
                  type="radio"
                  name="shipping-address"
                  checked={checked}
                  onChange={() => onSelect(address.id)}
                  className="mt-1 h-4 w-4 border-slate-300 text-emerald-600 focus:ring-emerald-500"
                />

                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-semibold text-slate-900">
                    {address.fullName}
                  </span>
                  <span className="block text-sm text-slate-600">
                    {address.phone}
                  </span>
                  <span className="mt-1 block text-sm text-slate-600">
                    {address.addressLine}
                  </span>
                </span>

                <span className="flex flex-col gap-1">
                  <button
                    type="button"
                    onClick={(event) => {
                      event.preventDefault();
                      onEdit(address.id);
                    }}
                    className="rounded-lg px-2 py-1 text-xs font-medium text-emerald-700 transition hover:bg-emerald-100"
                  >
                    Edit
                  </button>

                  <button
                    type="button"
                    onClick={(event) => {
                      event.preventDefault();
                      onDelete(address.id);
                    }}
                    className="rounded-lg px-2 py-1 text-xs font-medium text-rose-600 transition hover:bg-rose-50"
                  >
                    Delete
                  </button>
                </span>
              </label>
            );
          })}
        </div>
      )}
    </section>
  );
}
