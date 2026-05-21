/**
 * useCart - Hook để quản lý giỏ hàng
 * Xử lý: add/remove/update, loading, error
 */

import { useState, useCallback } from "react";
import { cartService } from "@/services";
import { Cart, CartItem, ApiError } from "@/types";

interface UseCartState {
  cart: Cart | null;
  loading: boolean;
  error: ApiError | null;
  totalItems: number;
  totalPrice: number;
}

export function useCart() {
  const [state, setState] = useState<UseCartState>({
    cart: null,
    loading: false,
    error: null,
    totalItems: 0,
    totalPrice: 0,
  });

  // Helper để update state
  const updateCartState = (cart: Cart) => {
    const totalItems = cartService.calculateTotalItems(cart);
    const totalPrice = cartService.calculateTotal(cart);

    setState((prev) => ({
      ...prev,
      cart,
      totalItems,
      totalPrice,
    }));
  };

  // Lấy giỏ hàng
  const getCart = useCallback(async () => {
    try {
      setState((prev) => ({ ...prev, loading: true, error: null }));
      const cart = await cartService.getCart();
      updateCartState(cart);
    } catch (err) {
      setState((prev) => ({
        ...prev,
        error: err as ApiError,
        loading: false,
      }));
    }
  }, []);

  // Thêm sản phẩm vào giỏ
  const addToCart = useCallback(async (plantId: string, quantity: number) => {
    try {
      setState((prev) => ({ ...prev, loading: true, error: null }));
      const response = await cartService.addToCart({ plantId, quantity });
      const cart = response.data?.cart;
      if (cart) {
        updateCartState(cart);
      }
      return true;
    } catch (err) {
      setState((prev) => ({
        ...prev,
        error: err as ApiError,
        loading: false,
      }));
      return false;
    }
  }, []);

  // Xóa sản phẩm khỏi giỏ
  const removeFromCart = useCallback(async (plantId: string) => {
    try {
      setState((prev) => ({ ...prev, loading: true, error: null }));
      const cart = await cartService.removeFromCart(plantId);
      updateCartState(cart);
      return true;
    } catch (err) {
      setState((prev) => ({
        ...prev,
        error: err as ApiError,
        loading: false,
      }));
      return false;
    }
  }, []);

  // Cập nhật số lượng
  const updateQuantity = useCallback(
    async (plantId: string, quantity: number) => {
      try {
        setState((prev) => ({ ...prev, loading: true, error: null }));
        const response = await cartService.updateCartItem({ plantId, quantity });
        const cart = response.data?.cart;
        if (cart) {
          updateCartState(cart);
        }
        return true;
      } catch (err) {
        setState((prev) => ({
          ...prev,
          error: err as ApiError,
          loading: false,
        }));
        return false;
      }
    },
    [],
  );

  // Xóa tất cả
  const clearCart = useCallback(async () => {
    try {
      setState((prev) => ({ ...prev, loading: true, error: null }));
      const cart = await cartService.clearCart();
      updateCartState(cart);
      return true;
    } catch (err) {
      setState((prev) => ({
        ...prev,
        error: err as ApiError,
        loading: false,
      }));
      return false;
    }
  }, []);

  return {
    ...state,
    getCart,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
  };
}
