import { BaseApiService } from "../base-api.service";
import {
  DashboardStats,
  RevenueChartData,
  OrderStatusChartData,
  RecentOrder,
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
}

export const dashboardService = new DashboardService();
