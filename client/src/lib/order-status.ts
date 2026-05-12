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
  { value: "pending", label: "Pending" },
  { value: "confirmed", label: "Confirmed" },
  { value: "processing", label: "Processing" },
  { value: "shipped", label: "Shipped" },
  { value: "delivered", label: "Delivered" },
  { value: "cancelled", label: "Cancelled" },
  { value: "returned", label: "Returned" },
];

export const PAYMENT_STATUS_OPTIONS: Array<{
  value: UiPaymentStatus;
  label: string;
}> = [
  { value: "unpaid", label: "Unpaid" },
  { value: "paid", label: "Paid" },
  { value: "failed", label: "Failed" },
  { value: "refunded", label: "Refunded" },
];

export const orderStatusLabel = (status: string): string => {
  const found = ORDER_STATUS_OPTIONS.find((o) => o.value === status);
  return found ? found.label : status;
};

export const paymentStatusLabel = (status: string): string => {
  const found = PAYMENT_STATUS_OPTIONS.find((o) => o.value === status);
  return found ? found.label : status;
};
