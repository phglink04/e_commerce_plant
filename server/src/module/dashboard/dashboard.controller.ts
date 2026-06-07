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

  @Get("low-stock")
  async getLowStockProducts(@Query("limit") limit: number = 10) {
    const data = await this.dashboardService.getLowStockProducts(limit);
    return {
      data,
      message: "Low stock products fetched successfully",
    };
  }

  @Get("top-customers")
  async getTopCustomers(@Query("limit") limit: number = 10) {
    const data = await this.dashboardService.getTopCustomers(limit);
    return {
      data,
      message: "Top customers fetched successfully",
    };
  }

  // ─── Analytics Endpoints (with date range filtering) ───────────

  @Get("analytics/stats")
  async getAnalyticsStats(
    @Query("start") start: string,
    @Query("end") end: string,
  ) {
    const { startDate, endDate } = parseLocalDateRange(start, end);
    const data = await this.dashboardService.getAnalyticsStats(startDate, endDate);
    return { data, message: "Analytics stats fetched successfully" };
  }

  @Get("analytics/order-status")
  async getAnalyticsOrderStatus(
    @Query("start") start: string,
    @Query("end") end: string,
  ) {
    const { startDate, endDate } = parseLocalDateRange(start, end);
    const data = await this.dashboardService.getAnalyticsOrderStatus(startDate, endDate);
    return { data, message: "Analytics order status fetched successfully" };
  }

  @Get("analytics/top-products")
  async getAnalyticsTopProducts(
    @Query("start") start: string,
    @Query("end") end: string,
    @Query("limit") limit: number = 10,
  ) {
    const { startDate, endDate } = parseLocalDateRange(start, end);
    const data = await this.dashboardService.getAnalyticsTopProducts(startDate, endDate, limit);
    return { data, message: "Analytics top products fetched successfully" };
  }

  @Get("analytics/review-stats")
  async getReviewStats(
    @Query("start") start: string,
    @Query("end") end: string,
  ) {
    const { startDate, endDate } = parseLocalDateRange(start, end);
    const data = await this.dashboardService.getReviewStats(startDate, endDate);
    return { data, message: "Review stats fetched successfully" };
  }

  @Get("analytics/recent-customers")
  async getRecentCustomers(
    @Query("start") start: string,
    @Query("end") end: string,
    @Query("limit") limit: number = 5,
  ) {
    const { startDate, endDate } = parseLocalDateRange(start, end);
    const data = await this.dashboardService.getRecentCustomers(startDate, endDate, limit);
    return { data, message: "Recent customers fetched successfully" };
  }
}

function parseLocalDateRange(startStr: string, endStr: string) {
  const tzOffsetOffsetMs = 7 * 60 * 60 * 1000; // ICT (UTC+7) in milliseconds

  const parseStart = (s: string) => {
    if (!s) return new Date(0);
    const [y, m, d] = s.split("-").map(Number);
    return new Date(Date.UTC(y, m - 1, d) - tzOffsetOffsetMs);
  };

  const parseEnd = (e: string) => {
    if (!e) return new Date();
    const [y, m, d] = e.split("-").map(Number);
    return new Date(Date.UTC(y, m - 1, d) + 24 * 60 * 60 * 1000 - 1 - tzOffsetOffsetMs);
  };

  return {
    startDate: parseStart(startStr),
    endDate: parseEnd(endStr),
  };
}
