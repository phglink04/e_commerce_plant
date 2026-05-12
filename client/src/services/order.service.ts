/**
 * Order Service
 * Tất cả API calls liên quan đến đơn hàng
 */

import { BaseApiService } from "./base-api.service";
import { Order, CreateOrderPayload, PaginatedResponse } from "@/types";
import { API_ENDPOINTS } from "@/constants";

class OrderService extends BaseApiService {
  /**
   * Lấy danh sách đơn hàng của người dùng hiện tại
   * Uses /api/orders/myorders (user endpoint, not the admin /api/orders)
   */
  async getMyOrders(): Promise<Order[]> {
    const response = await this.get<{ orders: Order[] }>(
      API_ENDPOINTS.orders.myList,
    );

    return response.data.orders || [];
  }

  /**
   * Lấy chi tiết đơn hàng của người dùng hiện tại
   * Uses /api/orders/myorders/:id (user endpoint)
   */
  async getMyOrderById(id: string): Promise<Order> {
    const response = await this.get<{ order: Order }>(
      API_ENDPOINTS.orders.myGetById(id),
    );
    return response.data.order;
  }

  /**
   * Lấy danh sách đơn hàng (admin only)
   */
  async getOrders(page = 1, limit = 10): Promise<PaginatedResponse<Order>> {
    const response = await this.get<{ orders: Order[] }>(
      API_ENDPOINTS.orders.list,
      {
        params: { page, limit },
      },
    );

    return {
      items: response.data.orders || [],
      totalResults: response.totalResults || 0,
      totalPages: response.totalPages || 1,
      page: response.page || page,
      limit: response.limit || limit,
    };
  }

  /**
   * Lấy chi tiết đơn hàng (admin only)
   */
  async getOrderById(id: string): Promise<Order> {
    const response = await this.get<{ order: Order }>(
      API_ENDPOINTS.orders.getById(id),
    );
    return response.data.order;
  }

  /**
   * Tạo đơn hàng mới
   */
  async createOrder(payload: CreateOrderPayload): Promise<Order> {
    const response = await this.post<Order>(
      API_ENDPOINTS.orders.create,
      payload,
    );
    return response.data;
  }

  /**
   * Hủy đơn hàng (PATCH, not POST)
   */
  async cancelOrder(id: string): Promise<Order> {
    const response = await this.patch<Order>(API_ENDPOINTS.orders.cancel(id));
    return response.data;
  }

  /**
   * Cập nhật trạng thái đơn hàng (admin)
   */
  async updateOrderStatus(id: string, status: string): Promise<Order> {
    const response = await this.patch<Order>(
      API_ENDPOINTS.orders.updateStatus(id),
      { status },
    );
    return response.data;
  }
}

export const orderService = new OrderService();
