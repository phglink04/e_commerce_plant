import { BaseApiService } from "../base-api.service";
import {
  DashboardStats,
  RevenueChartData,
  OrderStatusChartData,
  RecentOrder,
  TopProduct,
  LowStockProduct,
  AnalyticsStats,
  ReviewStats,
  RecentCustomer,
} from "@/types/admin";
import { ApiResponse } from "@/types/api";

class DashboardService extends BaseApiService {
  async getDashboardStats(): Promise<ApiResponse<DashboardStats>> {
    return await this.get<DashboardStats>("/api/admin/dashboard/stats");
  }

  async getRevenueChart(
    range: "week" | "month" | "year" = "week",
  ): Promise<ApiResponse<RevenueChartData[]>> {
    return await this.get<RevenueChartData[]>(
      `/api/admin/dashboard/chart/revenue?range=${range}`,
    );
  }

  async getOrderStatusChart(): Promise<ApiResponse<OrderStatusChartData[]>> {
    return await this.get<OrderStatusChartData[]>(
      "/api/admin/dashboard/chart/orders",
    );
  }

  async getRecentOrders(
    limit: number = 10,
  ): Promise<ApiResponse<RecentOrder[]>> {
    return await this.get<RecentOrder[]>(
      `/api/admin/dashboard/recent-orders?limit=${limit}`,
    );
  }

  async getTopProducts(
    limit: number = 10,
  ): Promise<ApiResponse<TopProduct[]>> {
    return await this.get<TopProduct[]>(
      `/api/admin/dashboard/top-products?limit=${limit}`,
    );
  }

  async getLowStockProducts(
    limit: number = 10,
  ): Promise<ApiResponse<LowStockProduct[]>> {
    return await this.get<LowStockProduct[]>(
      `/api/admin/dashboard/low-stock?limit=${limit}`,
    );
  }

  // ─── Analytics Endpoints ───────────────────────────────

  async getAnalyticsStats(start: string, end: string): Promise<ApiResponse<AnalyticsStats>> {
    return await this.get<AnalyticsStats>(
      `/api/admin/dashboard/analytics/stats?start=${start}&end=${end}`,
    );
  }

  async getAnalyticsOrderStatus(start: string, end: string): Promise<ApiResponse<OrderStatusChartData[]>> {
    return await this.get<OrderStatusChartData[]>(
      `/api/admin/dashboard/analytics/order-status?start=${start}&end=${end}`,
    );
  }

  async getAnalyticsTopProducts(start: string, end: string, limit: number = 10): Promise<ApiResponse<TopProduct[]>> {
    return await this.get<TopProduct[]>(
      `/api/admin/dashboard/analytics/top-products?start=${start}&end=${end}&limit=${limit}`,
    );
  }

  async getReviewStats(start: string, end: string): Promise<ApiResponse<ReviewStats>> {
    return await this.get<ReviewStats>(
      `/api/admin/dashboard/analytics/review-stats?start=${start}&end=${end}`,
    );
  }

  async getRecentCustomers(start: string, end: string, limit: number = 5): Promise<ApiResponse<RecentCustomer[]>> {
    return await this.get<RecentCustomer[]>(
      `/api/admin/dashboard/analytics/recent-customers?start=${start}&end=${end}&limit=${limit}`,
    );
  }
}

export const dashboardService = new DashboardService();
