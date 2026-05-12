export type OrderStatus =
  | "pending"
  | "confirmed"
  | "processing"
  | "shipped"
  | "delivered"
  | "cancelled"
  | "returned";

export type PaymentStatus =
  | "unpaid"
  | "paid"
  | "failed"
  | "refunded";

export type PaymentMethodType = "cash" | "qr";

export type OrderItem = {
  plantId: string;
  name: string;
  quantity: number;
  price: number;
};

export type OrderEntity = {
  id: string;
  userId: string;
  orderStatus: OrderStatus;
  paymentStatus: PaymentStatus;
  total: number;
  items: OrderItem[];
  shippingAddress: string;
  addressId?: string;
  shippingFee?: number;
  paymentMethod?: PaymentMethodType | null;
  transactionCode?: string | null;
  discount?: { code: string; amount: number } | null;
  createdAt: string;
  updatedAt: string;
};

/** Maps used during migration from old PascalCase single-status to new split statuses */
export const OLD_STATUS_TO_ORDER_STATUS: Record<string, OrderStatus> = {
  Pending: "pending",
  Paid: "confirmed",
  Processing: "processing",
  "Out for delivery": "shipped",
  Delivered: "delivered",
  Cancelled: "cancelled",
  Failed: "pending",
};

export const OLD_STATUS_TO_PAYMENT_STATUS: Record<string, PaymentStatus> = {
  Pending: "unpaid",
  Paid: "paid",
  Processing: "paid",
  "Out for delivery": "paid",
  Delivered: "paid",
  Cancelled: "unpaid",
  Failed: "failed",
};
