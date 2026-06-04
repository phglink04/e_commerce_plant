export type UiOrderStatus =
  | "pending"
  | "confirmed"
  | "processing"
  | "shipped"
  | "delivered"
  | "cancelled"
  | "returned";

export type UiPaymentStatus =
  | "unpaid"
  | "paid"
  | "failed"
  | "refunded";

export const ORDER_STATUS_OPTIONS: Array<{
  value: UiOrderStatus;
  label: string;
}> = [
  { value: "pending", label: "Chờ xác nhận" },
  { value: "confirmed", label: "Đã xác nhận" },
  { value: "processing", label: "Đang chuẩn bị" },
  { value: "shipped", label: "Đã gửi" },
  { value: "delivered", label: "Đã nhận" },
  { value: "cancelled", label: "Đã hủy" },
  { value: "returned", label: "Hoàn trả" },
];

export const PAYMENT_STATUS_OPTIONS: Array<{
  value: UiPaymentStatus;
  label: string;
}> = [
  { value: "unpaid", label: "Chưa thanh toán" },
  { value: "paid", label: "Đã trả tiền" },
  { value: "failed", label: "Thanh toán thất bại" },
  { value: "refunded", label: "Đã hoàn tiền" },
];

export const orderStatusLabel = (status: string): string => {
  const found = ORDER_STATUS_OPTIONS.find((o) => o.value === status);
  return found ? found.label : status;
};

export const paymentStatusLabel = (status: string): string => {
  const found = PAYMENT_STATUS_OPTIONS.find((o) => o.value === status);
  return found ? found.label : status;
};
