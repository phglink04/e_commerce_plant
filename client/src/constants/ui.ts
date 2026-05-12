/**
 * UI Constants
 * Định nghĩa các hằng số UI như màu sắc, kích cỡ, v.v.
 */

export const COLORS = {
  primary: "#22c55e", // success green
  secondary: "#64748b",
  danger: "#ef4444",
  warning: "#f59e0b",
  info: "#3b82f6",
  success: "#22c55e",
  light: "#ecffed",
  dark: "#1f2937",
};

export const SIZES = {
  xs: "8px",
  sm: "12px",
  md: "16px",
  lg: "24px",
  xl: "32px",
};

export const BREAKPOINTS = {
  sm: "640px",
  md: "768px",
  lg: "1024px",
  xl: "1280px",
  "2xl": "1536px",
};

export const PRODUCT_CARD_SIZES = {
  SMALL: "small", // Avatar + Name + Price
  MEDIUM: "medium", // + Add to Cart button
  LARGE: "large", // + Description
} as const;

export const SKELETON_LINES = {
  PRODUCT_CARD: 5,
  PRODUCT_LIST: 12,
} as const;

// Toast messages
export const TOAST_MESSAGES = {
  productAdded: "Sản phẩm đã được thêm vào giỏ hàng",
  productRemoved: "Sản phẩm đã được xóa khỏi giỏ hàng",
  productUpdated: "Sản phẩm đã được cập nhật",
  productDeleted: "Sản phẩm đã được xóa",
  loginSuccess: "Đăng nhập thành công",
  loginFailed: "Đăng nhập thất bại",
  orderPlaced: "Đơn hàng đã được đặt",
  orderCancelled: "Đơn hàng đã được hủy",
  error: "Có lỗi xảy ra, vui lòng thử lại",
  loading: "Đang tải...",
};

// Validation messages
export const VALIDATION_MESSAGES = {
  required: "Trường này bắt buộc",
  minLength: (min: number) => `Tối thiểu ${min} ký tự`,
  maxLength: (max: number) => `Tối đa ${max} ký tự`,
  invalidEmail: "Email không hợp lệ",
  passwordMismatch: "Mật khẩu không khớp",
  minPrice: (min: number) => `Giá tối thiểu ${min.toLocaleString("vi-VN")}đ`,
  maxPrice: (max: number) => `Giá tối đa ${max.toLocaleString("vi-VN")}đ`,
};
