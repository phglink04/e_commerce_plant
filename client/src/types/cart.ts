/**
 * Cart Types
 * Định nghĩa cấu trúc giỏ hàng
 */

import { Product } from "./product";

export interface CartItem {
  plantId: string;
  quantity: number;
  price: number;
  product?: Product; // Dữ liệu chi tiết sản phẩm (optional)
  maxQuantity?: number; // Max available stock
  quantityWarning?: string; // Warning message if quantity exceeds stock
}

export interface Cart {
  id?: string;
  userId?: string;
  items: CartItem[];
  totalItems: number;
  totalPrice: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface AddToCartPayload {
  plantId: string;
  quantity: number;
}

export interface UpdateCartItemPayload {
  plantId: string;
  quantity: number;
}

export interface CartResponse {
  message: string;
  data: {
    cart: Cart;
    stockWarning?: string;
    quantityAdjusted?: boolean;
    maxQuantity?: number;
  };
}
