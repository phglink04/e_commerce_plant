"use client";

import Image from "next/image";
import type { CartItem as CartItemType, Plant } from "./types";

type CartItemProps = {
  item: CartItemType;
  plant?: Plant;
  selected: boolean;
  disabled?: boolean;
  onToggle: (plantId: string) => void;
  onIncrease: (plantId: string) => void;
  onDecrease: (plantId: string) => void;
  onRemove: (plantId: string) => void;
};

const normalizeImageSrc = (src?: string): string => {
  if (!src) {
    return "/frontend/Profile.jpg";
  }

  if (
    src.startsWith("http://") ||
    src.startsWith("https://") ||
    src.startsWith("data:")
  ) {
    return src;
  }

  return src.startsWith("/") ? src : `/${src}`;
};

export default function CartItem({
  item,
  plant,
  selected,
  disabled = false,
  onToggle,
  onIncrease,
  onDecrease,
  onRemove,
}: CartItemProps) {
  const name = plant?.name ?? "Plant";
  const imageSrc = normalizeImageSrc(plant?.imageCover);
  const subtotal = item.price * item.quantity;
  const hasDiscount = plant && (plant.discountPercentage ?? 0) > 0;

  return (
    <article className="flex gap-3 rounded-2xl border border-emerald-100 bg-white p-3 shadow-sm transition hover:shadow-md md:gap-4 md:p-4">
      <label className="mt-2 flex h-5 w-5 shrink-0 cursor-pointer items-center justify-center">
        <input
          type="checkbox"
          checked={selected}
          onChange={() => onToggle(item.plantId)}
          disabled={disabled}
          className="h-4 w-4 rounded border-emerald-300 text-emerald-600 focus:ring-emerald-500"
          aria-label={`Select ${name}`}
        />
      </label>

      <Image
        src={imageSrc}
        alt={name}
        width={100}
        height={100}
        className="h-20 w-20 rounded-xl object-cover md:h-24 md:w-24"
      />

      <div className="min-w-0 flex-1">
        <h3 className="truncate text-sm font-semibold text-slate-900 md:text-base">
          {name}
        </h3>
        <div className="mt-1 flex items-center gap-2">
          <span className="text-sm font-medium text-emerald-700">
            {item.price.toLocaleString("vi-VN")} VND
          </span>
          {hasDiscount && (
            <>
              <span className="text-xs text-slate-400 line-through">
                {plant.price.toLocaleString("vi-VN")} VND
              </span>
              <span className="rounded bg-rose-100 px-1.5 py-0.5 text-[10px] font-bold text-rose-600">
                -{plant.discountPercentage}%
              </span>
            </>
          )}
        </div>
        <p className="text-xs text-slate-500 md:text-sm">
          Subtotal: {subtotal.toLocaleString("vi-VN")} VND
        </p>

        <div className="mt-3 flex flex-wrap items-center gap-3">
          <div className="inline-flex items-center overflow-hidden rounded-lg border border-slate-200">
            <button
              type="button"
              onClick={() => onDecrease(item.plantId)}
              disabled={disabled}
              className="h-8 w-8 border-r border-slate-200 text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
              aria-label="Decrease quantity"
            >
              -
            </button>
            <span className="inline-flex h-8 min-w-10 items-center justify-center px-2 text-sm font-medium text-slate-700">
              {item.quantity}
            </span>
            <button
              type="button"
              onClick={() => onIncrease(item.plantId)}
              disabled={disabled}
              className="h-8 w-8 border-l border-slate-200 text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
              aria-label="Increase quantity"
            >
              +
            </button>
          </div>

          <button
            type="button"
            onClick={() => onRemove(item.plantId)}
            disabled={disabled}
            className="rounded-lg border border-rose-200 px-3 py-1.5 text-xs font-medium text-rose-600 transition hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Remove
          </button>
        </div>
      </div>
    </article>
  );
}
