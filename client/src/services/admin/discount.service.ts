/**
 * Discount Service
 * API calls for admin discount management and user coupon application
 */

import { BaseApiService } from "../base-api.service";
import {
  Discount,
  CreateDiscountPayload,
  UpdateDiscountPayload,
  ApplyDiscountPayload,
  ApplyDiscountResponse,
} from "@/types/discount";
import { API_ENDPOINTS } from "@/constants";

interface PaginatedDiscountResponse {
  items: Discount[];
  totalResults: number;
  totalPages: number;
  page: number;
  limit: number;
}

class DiscountService extends BaseApiService {
  /**
   * List discounts (admin) with pagination and search
   */
  async getDiscounts(params: {
    page?: number;
    limit?: number;
    search?: string;
    status?: string;
  }): Promise<PaginatedDiscountResponse> {
    const response = await this.get<{ discounts: Discount[] }>(
      API_ENDPOINTS.discounts.list,
      {
        params: {
          page: params.page,
          limit: params.limit,
          search: params.search?.trim() || undefined,
          status: params.status || undefined,
        },
      },
    );

    return {
      items: response.data?.discounts || [],
      totalResults: response.totalResults || 0,
      totalPages: response.totalPages || 1,
      page: response.page || params.page || 1,
      limit: params.limit || 12,
    };
  }

  /**
   * Get discount by ID (admin)
   */
  async getDiscountById(id: string): Promise<Discount> {
    const response = await this.get<{ discount: Discount }>(
      API_ENDPOINTS.discounts.getById(id),
    );
    return response.data.discount;
  }

  /**
   * Create discount (admin)
   */
  async createDiscount(payload: CreateDiscountPayload): Promise<Discount> {
    const response = await this.post<{ discount: Discount }>(
      API_ENDPOINTS.discounts.create,
      payload,
    );
    return response.data.discount;
  }

  /**
   * Update discount (admin)
   */
  async updateDiscount(
    id: string,
    payload: UpdateDiscountPayload,
  ): Promise<Discount> {
    const response = await this.patch<{ discount: Discount }>(
      API_ENDPOINTS.discounts.update(id),
      payload,
    );
    return response.data.discount;
  }

  /**
   * Delete discount (admin)
   */
  async deleteDiscount(id: string): Promise<void> {
    await this.delete(API_ENDPOINTS.discounts.delete(id));
  }

  /**
   * Apply discount code (user-facing checkout)
   */
  async applyDiscount(
    payload: ApplyDiscountPayload,
  ): Promise<ApplyDiscountResponse> {
    const response = await this.post<ApplyDiscountResponse>(
      API_ENDPOINTS.discounts.apply,
      payload,
    );
    // The backend returns the response directly (not nested in data)
    return response.data ?? (response as unknown as ApplyDiscountResponse);
  }
}

export const discountService = new DiscountService();
