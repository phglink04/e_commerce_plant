/**
 * Order Types
 * Định nghĩa cấu trúc đơn hàng
 */

export interface OrderItem {
  plantId: string;
  name: string;
  quantity: number;
  price: number;
}

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

export interface Order {
  _id: string;
  id: string;
  userId: string;
  orderStatus: OrderStatus;
  paymentStatus: PaymentStatus;
  items: OrderItem[];
  total: number;
  shippingAddress: string;
  addressId?: string;
  shippingFee?: number;
  paymentMethod?: string;
  transactionCode?: string;
  discount?: { code: string; amount: number } | null;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateOrderPayload {
  items: OrderItem[];
  shippingAddress: string;
  addressId?: string;
  paymentMethod?: string;
  discountCode?: string;
  discountAmount?: number;
  notes?: string;
}
