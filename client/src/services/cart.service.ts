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
  CartResponse,
} from "@/types";
import { API_ENDPOINTS } from "@/constants";

interface CartServiceResponse extends CartResponse {
  stockWarning?: string;
  quantityAdjusted?: boolean;
}

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
  async addToCart(payload: AddToCartPayload): Promise<CartServiceResponse> {
    const response = await this.post<CartServiceResponse>(
      API_ENDPOINTS.cart.add,
      payload,
    );
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
  async updateCartItem(payload: UpdateCartItemPayload): Promise<CartServiceResponse> {
    const response = await this.patch<CartServiceResponse>(
      API_ENDPOINTS.cart.update,
      payload,
    );
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
