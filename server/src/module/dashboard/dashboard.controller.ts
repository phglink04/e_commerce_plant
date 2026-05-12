import { Controller, Get, Query, UseGuards } from "@nestjs/common";
import { DashboardService } from "./dashboard.service";
import { JwtAuthGuard } from "../../auth/guards/jwt-auth.guard";
import { AdminGuard } from "../../auth/guards/admin.guard";

@Controller("admin/dashboard")
@UseGuards(JwtAuthGuard, AdminGuard)
export class DashboardController {
  constructor(private dashboardService: DashboardService) {}

  @Get("stats")
  async getStats() {
    const stats = await this.dashboardService.getDashboardStats();
    return {
      data: stats,
      message: "Dashboard stats fetched successfully",
    };
  }

  @Get("chart/revenue")
  async getRevenueChart(
    @Query("range") range: "week" | "month" | "year" = "week",
  ) {
    const data = await this.dashboardService.getRevenueChart(range);
    return {
      data,
      message: "Revenue chart data fetched successfully",
    };
  }

  @Get("chart/orders")
  async getOrderStatusChart() {
    const data = await this.dashboardService.getOrderStatusChart();
    return {
      data,
      message: "Order status chart data fetched successfully",
    };
  }

  @Get("top-products")
  async getTopProducts(@Query("limit") limit: number = 10) {
    const data = await this.dashboardService.getTopProducts(limit);
    return {
      data,
      message: "Top products fetched successfully",
    };
  }

  @Get("recent-orders")
  async getRecentOrders(@Query("limit") limit: number = 10) {
    const data = await this.dashboardService.getRecentOrders(limit);
    return {
      data,
      message: "Recent orders fetched successfully",
    };
  }
}
