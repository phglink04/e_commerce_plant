import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { Order } from "../orders/schemas/order.schema";
import { Plant } from "../plants/schemas/plant.schema";
import { User } from "../users/schemas/user.schema";
import { Review } from "../reviews/schemas/review.schema";

@Injectable()
export class DashboardService {
  constructor(
    @InjectModel(Order.name) private orderModel: Model<Order>,
    @InjectModel(Plant.name) private plantModel: Model<Plant>,
    @InjectModel(User.name) private userModel: Model<User>,
    @InjectModel(Review.name) private reviewModel: Model<Review>,
  ) {}

  async getDashboardStats() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const thisWeekStart = new Date(today);
    thisWeekStart.setDate(today.getDate() - today.getDay());

    const thisMonthStart = new Date(today.getFullYear(), today.getMonth(), 1);

    // Revenue calculations — count orders that are delivered AND paid
    const revenueFilter = {
      orderStatus: "delivered",
      paymentStatus: "paid",
    };

    const todayRevenue = await this.orderModel.aggregate([
      {
        $match: {
          createdAt: { $gte: today },
          ...revenueFilter,
        },
      },
      { $group: { _id: null, total: { $sum: "$total" } } },
    ]);

    const thisWeekRevenue = await this.orderModel.aggregate([
      {
        $match: {
          createdAt: { $gte: thisWeekStart },
          ...revenueFilter,
        },
      },
      { $group: { _id: null, total: { $sum: "$total" } } },
    ]);

    const thisMonthRevenue = await this.orderModel.aggregate([
      {
        $match: {
          createdAt: { $gte: thisMonthStart },
          ...revenueFilter,
        },
      },
      { $group: { _id: null, total: { $sum: "$total" } } },
    ]);

    const totalRevenue = await this.orderModel.aggregate([
      {
        $match: revenueFilter,
      },
      { $group: { _id: null, total: { $sum: "$total" } } },
    ]);

    // Order statistics
    const orderStats = await this.orderModel.aggregate([
      {
        $group: {
          _id: "$orderStatus",
          count: { $sum: 1 },
        },
      },
    ]);

    const totalOrders = await this.orderModel.countDocuments();

    // Product statistics
    const totalProducts = await this.plantModel.countDocuments();
    const outOfStockProducts = await this.plantModel.countDocuments({
      stock: { $lte: 0 },
    });
    const featuredProducts = await this.plantModel.countDocuments({
      isFeatured: true,
    });

    // User statistics
    const totalUsers = await this.userModel.countDocuments();
    const newUsersThisMonth = await this.userModel.countDocuments({
      createdAt: { $gte: thisMonthStart },
    });
    const activeUsers = await this.userModel.countDocuments({
      lastLogin: {
        $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
      },
    });

    return {
      revenue: {
        today: todayRevenue[0]?.total || 0,
        thisWeek: thisWeekRevenue[0]?.total || 0,
        thisMonth: thisMonthRevenue[0]?.total || 0,
        total: totalRevenue[0]?.total || 0,
      },
      orders: {
        total: totalOrders,
        pending: orderStats.find((s: any) => s._id === "pending")?.count || 0,
        processing:
          orderStats.find((s: any) => s._id === "processing")?.count || 0,
        delivered:
          orderStats.find((s: any) => s._id === "delivered")?.count || 0,
        cancelled:
          orderStats.find((s: any) => s._id === "cancelled")?.count || 0,
      },
      products: {
        total: totalProducts,
        outOfStock: outOfStockProducts,
        featured: featuredProducts,
      },
      users: {
        total: totalUsers,
        newThisMonth: newUsersThisMonth,
        active: activeUsers,
      },
    };
  }

  async getRevenueChart(range: "week" | "month" | "year" = "week") {
    let dateFormat = "%Y-%m-%d";
    let daysBack = 7;

    if (range === "month") {
      dateFormat = "%Y-%m-%d";
      daysBack = 30;
    } else if (range === "year") {
      dateFormat = "%Y-%m";
      daysBack = 365;
    }

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - daysBack);

    return await this.orderModel.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate },
          orderStatus: "delivered",
          paymentStatus: "paid",
        },
      },
      {
        $group: {
          _id: {
            $dateToString: { format: dateFormat, date: "$createdAt" },
          },
          revenue: { $sum: "$total" },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);
  }

  async getOrderStatusChart() {
    return await this.orderModel.aggregate([
      {
        $group: {
          _id: "$orderStatus",
          count: { $sum: 1 },
        },
      },
    ]);
  }

  async getTopProducts(limit: number = 10) {
    return await this.orderModel.aggregate([
      {
        $match: {
          orderStatus: "delivered",
          paymentStatus: "paid",
        },
      },
      { $unwind: "$items" },
      {
        $group: {
          _id: "$items.plantId",
          totalSold: { $sum: "$items.quantity" },
          revenue: {
            $sum: { $multiply: ["$items.quantity", "$items.price"] },
          },
        },
      },
      { $sort: { totalSold: -1 } },
      { $limit: limit },
      {
        $addFields: {
          productObjId: { $toObjectId: "$_id" },
        },
      },
      {
        $lookup: {
          from: "plants",
          localField: "productObjId",
          foreignField: "_id",
          as: "product",
        },
      },
    ]);
  }

  async getRecentOrders(limit: number = 10) {
    return await this.orderModel
      .find()
      .sort({ createdAt: -1 })
      .limit(limit)
      .populate("userId", "name email")
      .exec();
  }

  async getLowStockProducts(limit: number = 10) {
    return await this.plantModel
      .find({ stock: { $gt: 0, $lte: 5 } })
      .sort({ stock: 1 })
      .limit(limit)
      .select("name slug price stock imageCover category availability")
      .lean()
      .exec();
  }

  // ─── Analytics Endpoints (with date range filtering) ───────────

  async getAnalyticsStats(startDate: Date, endDate: Date) {
    const dateFilter = { createdAt: { $gte: startDate, $lte: endDate } };
    const revenueFilter = {
      ...dateFilter,
      orderStatus: "delivered",
      paymentStatus: "paid",
    };

    const revenueResult = await this.orderModel.aggregate([
      { $match: revenueFilter },
      { $group: { _id: null, total: { $sum: "$total" }, count: { $sum: 1 } } },
    ]);

    const totalOrders = await this.orderModel.countDocuments(dateFilter);
    const newCustomers = await this.userModel.countDocuments(dateFilter);

    return {
      revenue: revenueResult[0]?.total || 0,
      paidOrders: revenueResult[0]?.count || 0,
      totalOrders,
      newCustomers,
    };
  }

  async getAnalyticsOrderStatus(startDate: Date, endDate: Date) {
    return await this.orderModel.aggregate([
      { $match: { createdAt: { $gte: startDate, $lte: endDate } } },
      { $group: { _id: "$orderStatus", count: { $sum: 1 } } },
    ]);
  }

  async getAnalyticsTopProducts(startDate: Date, endDate: Date, limit: number = 10) {
    return await this.orderModel.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate, $lte: endDate },
          orderStatus: "delivered",
          paymentStatus: "paid",
        },
      },
      { $unwind: "$items" },
      {
        $group: {
          _id: "$items.plantId",
          totalSold: { $sum: "$items.quantity" },
          revenue: { $sum: { $multiply: ["$items.quantity", "$items.price"] } },
        },
      },
      { $sort: { totalSold: -1 } },
      { $limit: limit },
      {
        $addFields: {
          productObjId: { $toObjectId: "$_id" },
        },
      },
      {
        $lookup: {
          from: "plants",
          localField: "productObjId",
          foreignField: "_id",
          as: "product",
        },
      },
    ]);
  }

  async getReviewStats(startDate: Date, endDate: Date) {
    const dateFilter = { createdAt: { $gte: startDate, $lte: endDate } };

    const totalReviews = await this.reviewModel.countDocuments(dateFilter);
    const pendingReviews = await this.reviewModel.countDocuments({
      ...dateFilter,
      isApproved: false,
    });

    const avgResult = await this.reviewModel.aggregate([
      { $match: dateFilter },
      { $group: { _id: null, avg: { $avg: "$rating" } } },
    ]);

    const distribution = await this.reviewModel.aggregate([
      { $match: dateFilter },
      { $group: { _id: "$rating", count: { $sum: 1 } } },
      { $sort: { _id: -1 } },
    ]);

    const recentReviews = await this.reviewModel.aggregate([
      { $match: dateFilter },
      { $sort: { createdAt: -1 } },
      { $limit: 5 },
      {
        $addFields: {
          productObjId: { $toObjectId: "$productId" },
        },
      },
      {
        $lookup: {
          from: "plants",
          localField: "productObjId",
          foreignField: "_id",
          as: "productInfo",
        },
      },
      {
        $project: {
          _id: 1,
          rating: 1,
          content: 1,
          userName: 1,
          isApproved: 1,
          createdAt: 1,
          productName: { $arrayElemAt: ["$productInfo.name", 0] },
        },
      },
    ]);

    return {
      total: totalReviews,
      pending: pendingReviews,
      avgRating: Math.round((avgResult[0]?.avg || 0) * 10) / 10,
      distribution: distribution.map((d: any) => ({
        rating: d._id,
        count: d.count,
      })),
      recent: recentReviews,
    };
  }

  async getRecentCustomers(startDate: Date, endDate: Date, limit: number = 5) {
    return await this.userModel
      .find({ createdAt: { $gte: startDate, $lte: endDate } })
      .sort({ createdAt: -1 })
      .limit(limit)
      .select("name email createdAt avatar")
      .lean()
      .exec();
  }
}
