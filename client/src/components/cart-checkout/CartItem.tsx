"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import type { CartItem as CartItemType, Plant } from "./types";

type CartItemProps = {
  item: CartItemType;
  plant?: Plant;
  selected: boolean;
  disabled?: boolean;
  maxStock?: number;
  onToggle: (plantId: string) => void;
  onIncrease: (plantId: string) => void;
  onDecrease: (plantId: string) => void;
  onRemove: (plantId: string) => void;
  onChangeQty: (plantId: string, quantity: number) => void;
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
  maxStock = 0,
  onToggle,
  onIncrease,
  onDecrease,
  onRemove,
  onChangeQty,
}: CartItemProps) {
  const [localQty, setLocalQty] = useState(String(item.quantity));

  useEffect(() => {
    setLocalQty(String(item.quantity));
  }, [item.quantity]);

  const name = plant?.name ?? "Sản phẩm";
  const imageSrc = normalizeImageSrc(plant?.imageCover);
  const subtotal = item.price * item.quantity;
  const hasDiscount = plant && (plant.discountPercentage ?? 0) > 0;
  const isDiscontinued = plant?.availability === "Discontinued";
  const isOutOfStock = maxStock <= 0 || isDiscontinued;
  const isOverMaxStock = !isDiscontinued && item.quantity > maxStock;
  const canIncrease = !isOutOfStock && item.quantity < maxStock;

  return (
    <article className={`flex gap-3 rounded-2xl border p-3 shadow-sm transition hover:shadow-md md:gap-4 md:p-4 ${
      isDiscontinued
        ? "border-rose-200 bg-rose-50/50 opacity-80"
        : isOutOfStock 
        ? "border-rose-200 bg-rose-50" 
        : isOverMaxStock
        ? "border-amber-200 bg-amber-50"
        : "border-emerald-100 bg-white"
    }`}>
      <label className="mt-2 flex h-5 w-5 shrink-0 cursor-pointer items-center justify-center">
        <input
          type="checkbox"
          checked={selected}
          onChange={() => onToggle(item.plantId)}
          disabled={disabled || isOutOfStock}
          className="h-4 w-4 rounded border-emerald-300 text-emerald-600 focus:ring-emerald-500"
          aria-label={`Select ${name}`}
        />
      </label>

      <Image
        src={imageSrc}
        alt={name}
        width={100}
        height={100}
        className={`h-20 w-20 rounded-xl object-cover md:h-24 md:w-24 ${
          isOutOfStock ? "opacity-50" : ""
        }`}
      />

      <div className="min-w-0 flex-1">
        <h3 className={`truncate text-sm font-semibold md:text-base ${
          isOutOfStock ? "text-slate-500" : "text-slate-900"
        }`}>
          {name}
        </h3>
        <div className="mt-1 flex items-center gap-2">
          <span className={`text-sm font-medium ${
            isOutOfStock ? "text-slate-500" : "text-emerald-700"
          }`}>
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
          Tạm tính: {subtotal.toLocaleString("vi-VN")} VND
        </p>

        {/* Stock information and warnings */}
        <div className="mt-2 space-y-1">
          {isDiscontinued ? (
            <p className="text-xs font-medium text-rose-600">
              ⚠️ Sản phẩm đã ngừng kinh doanh
            </p>
          ) : isOutOfStock ? (
            <p className="text-xs font-medium text-rose-600">
              ⚠️ Sản phẩm hết hàng
            </p>
          ) : null}
          {isOverMaxStock && maxStock > 0 && (
            <p className="text-xs font-medium text-amber-600">
              ⚠️ Kho chỉ còn {maxStock} sản phẩm. Đã điều chỉnh số lượng.
            </p>
          )}
          {!isOutOfStock && maxStock > 0 && (
            <p className="text-xs text-slate-500">
              Kho còn: <span className="font-medium text-slate-700">{maxStock}</span>
            </p>
          )}
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-3">
          <div className="inline-flex items-center overflow-hidden rounded-lg border border-slate-200">
            <button
              type="button"
              onClick={() => onDecrease(item.plantId)}
              disabled={disabled || isOutOfStock || item.quantity <= 1}
              className="h-8 w-8 border-r border-slate-200 text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
              aria-label="Decrease quantity"
            >
              −
            </button>
            <input
              type="number"
              min={1}
              max={maxStock}
              value={localQty}
              onChange={(e) => {
                setLocalQty(e.target.value);
              }}
              onBlur={() => {
                let val = parseInt(localQty, 10);
                if (isNaN(val) || val <= 0) {
                  val = 1;
                } else if (val > maxStock) {
                  val = maxStock;
                }
                setLocalQty(String(val));
                if (val !== item.quantity) {
                  onChangeQty(item.plantId, val);
                }
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.currentTarget.blur();
                }
              }}
              disabled={disabled || isOutOfStock}
              className="w-12 text-center text-sm font-medium text-slate-700 bg-transparent border-0 focus:outline-none focus:ring-0 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
              style={{ padding: 0 }}
              aria-label="Quantity"
            />
            <button
              type="button"
              onClick={() => onIncrease(item.plantId)}
              disabled={disabled || !canIncrease}
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
            Xóa
          </button>
        </div>
      </div>
    </article>
  );
}
