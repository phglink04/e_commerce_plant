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
