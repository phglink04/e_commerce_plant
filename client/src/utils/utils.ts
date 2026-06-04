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

/**
 * Remove Vietnamese tones/accents from a string
 */
export function removeVietnameseTones(str: string): string {
  if (!str) return "";
  let result = str;
  result = result.replace(/à|á|ạ|ả|ã|â|ầ|ấ|ậ|ẩ|ẫ|ă|ằ|ắ|ặ|ẳ|ẵ/g, "a");
  result = result.replace(/è|é|ẹ|ẻ|ẽ|ê|ề|ế|ệ|ể|ễ/g, "e");
  result = result.replace(/ì|í|ị|ỉ|ĩ/g, "i");
  result = result.replace(/ò|ó|ọ|ỏ|õ|ô|ồ|ố|ộ|ổ|ỗ|ơ|ờ|ớ|ợ|ở|ỡ/g, "o");
  result = result.replace(/ù|ú|ụ|ủ|ũ|ư|ừ|ứ|ự|ử|ữ/g, "u");
  result = result.replace(/ỳ|ý|ỵ|ỷ|ỹ/g, "y");
  result = result.replace(/đ/g, "d");
  result = result.replace(/À|Á|Ạ|Ả|Ã|Â|Ầ|Ấ|Ậ|Ẩ|Ẫ|Ă|Ằ|Ắ|Ặ|Ẳ|Ẵ/g, "A");
  result = result.replace(/È|É|Ẹ|Ẻ|Ẽ|Ê|Ề|Ế|Ệ|Ể|Ễ/g, "E");
  result = result.replace(/Ì|Í|Ị|Ỉ|Ĩ/g, "I");
  result = result.replace(/Ò|Ó|Ọ|Ỏ|Õ|Ô|Ồ|Ố|Ộ|Ổ|Ỗ|Ơ|Ờ|Ớ|Ợ|Ở|Ỡ/g, "O");
  result = result.replace(/Ù|Ú|Ụ|Ủ|Ũ|Ư|Ừ|Ứ|Ự|Ử|Ữ/g, "U");
  result = result.replace(/Ỳ|Ý|Ỵ|Ỷ|Ỹ/g, "Y");
  result = result.replace(/Đ/g, "D");
  // Combine accents if encoded separately
  result = result.replace(/\u0300|\u0301|\u0309|\u0303|\u0323/g, "");
  result = result.replace(/\u02C6|\u0306|\u031B/g, "");
  return result;
}

