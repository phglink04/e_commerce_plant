/**
 * Cart Service
 * Tất cả API calls liên quan đến giỏ hàng
 */

import { BaseApiService } from "./base-api.service";
import {
  Cart,
  CartItem,
  AddToCartPayload,
  UpdateCartItemPayload,
} from "@/types";
import { API_ENDPOINTS } from "@/constants";

class CartService extends BaseApiService {
  /**
   * Lấy giỏ hàng hiện tại
   */
  async getCart(): Promise<Cart> {
    const response = await this.get<Cart>(API_ENDPOINTS.cart.get);
    return response.data;
  }

  /**
   * Thêm sản phẩm vào giỏ hàng
   */
  async addToCart(payload: AddToCartPayload): Promise<Cart> {
    const response = await this.post<Cart>(API_ENDPOINTS.cart.add, payload);
    return response.data;
  }

  /**
   * Xóa sản phẩm khỏi giỏ hàng
   */
  async removeFromCart(plantId: string): Promise<Cart> {
    const response = await this.post<Cart>(API_ENDPOINTS.cart.remove, {
      plantId,
    });
    return response.data;
  }

  /**
   * Cập nhật số lượng sản phẩm trong giỏ hàng
   */
  async updateCartItem(payload: UpdateCartItemPayload): Promise<Cart> {
    const response = await this.patch<Cart>(API_ENDPOINTS.cart.update, payload);
    return response.data;
  }

  /**
   * Xóa tất cả sản phẩm khỏi giỏ hàng
   */
  async clearCart(): Promise<Cart> {
    const response = await this.post<Cart>(API_ENDPOINTS.cart.clear);
    return response.data;
  }

  /**
   * Tính toán tổng tiền trong giỏ
   */
  calculateTotal(cart: Cart): number {
    return cart.items.reduce(
      (total, item) => total + item.price * item.quantity,
      0,
    );
  }

  /**
   * Tính toán tổng số lượng sản phẩm
   */
  calculateTotalItems(cart: Cart): number {
    return cart.items.reduce((total, item) => total + item.quantity, 0);
  }
}

export const cartService = new CartService();
