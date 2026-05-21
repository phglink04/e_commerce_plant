import type { PlantProduct } from "src/types/plant";

export const normalizeImageSrc = (src?: string): string => {
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

export const safeRating = (value?: number): number => {
  if (typeof value === "number" && Number.isFinite(value)) {
    return Math.max(1, Math.min(5, value));
  }

  return Number((3.8 + Math.random() * 1.2).toFixed(1));
};

export const safeDiscount = (value?: number): number => {
  if (typeof value === "number" && Number.isFinite(value)) {
    return Math.max(0, Math.min(70, Math.round(value)));
  }

  return Math.floor(10 + Math.random() * 30);
};

export const calcDiscountedPrice = (
  price: number,
  discountPercentage: number,
): number => {
  const discounted = price - (price * discountPercentage) / 100;
  return Math.max(0, Math.round(discounted));
};

export const enrichProduct = (item: PlantProduct): PlantProduct => ({
  ...item,
  rating: safeRating(item.rating),
  discountPercentage: safeDiscount(item.discountPercentage),
  category: item.category ?? item.tag ?? "Indoor Plants",
});

export const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat("vi-VN").format(Math.round(value)) + "₫";
};

