import { Injectable, Logger, OnModuleInit } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model, Types } from "mongoose";
import { CreateOrderDto } from "./dto/create-order.dto";
import {
  OrderStatus,
  PaymentStatus,
  OLD_STATUS_TO_ORDER_STATUS,
  OLD_STATUS_TO_PAYMENT_STATUS,
} from "./types/order.type";
import { Order } from "./schemas/order.schema";
import { DiscountsService } from "../discounts/discounts.service";
import { PlantsService } from "../plants/plants.service";

const toIsoString = (value: unknown): string => {
  if (value instanceof Date) {
    return Number.isNaN(value.getTime())
      ? new Date().toISOString()
      : value.toISOString();
  }

  if (typeof value === "string") {
    const parsed = new Date(value);
    if (!Number.isNaN(parsed.getTime())) {
      return parsed.toISOString();
    }
  }

  return new Date().toISOString();
};

@Injectable()
export class OrdersService implements OnModuleInit {
  private readonly logger = new Logger(OrdersService.name);

  constructor(
    @InjectModel(Order.name) private readonly orderModel: Model<Order>,
    private readonly discountsService: DiscountsService,
    private readonly plantsService: PlantsService,
  ) {}

  // ─── Data Migration ────────────────────────────────────────
  async onModuleInit() {
    await this.migrateOldStatusField();
  }

  /**
   * Migrate old `status` field (PascalCase) to new `orderStatus` + `paymentStatus` (lowercase).
   * Runs once on startup; only touches docs that still have the legacy `status` field.
   */
  private async migrateOldStatusField() {
    try {
      // Find documents that still carry the old `status` field
      const legacyDocs = await this.orderModel
        .find({ status: { $exists: true } } as any)
        .lean();

      if (legacyDocs.length === 0) {
        return;
      }

      this.logger.log(
        `Migrating ${legacyDocs.length} orders from legacy status field…`,
      );

      const bulkOps = legacyDocs.map((doc: any) => {
        const oldStatus: string = doc.status ?? "Pending";
        const newOrderStatus: OrderStatus =
          OLD_STATUS_TO_ORDER_STATUS[oldStatus] ?? "pending";
        const newPaymentStatus: PaymentStatus =
          OLD_STATUS_TO_PAYMENT_STATUS[oldStatus] ?? "unpaid";

        return {
          updateOne: {
            filter: { _id: doc._id },
            update: {
              $set: {
                orderStatus: newOrderStatus,
                paymentStatus: newPaymentStatus,
              },
              $unset: { status: "" as const },
            },
          },
        };
      });

      const result = await this.orderModel.bulkWrite(bulkOps as any);
      this.logger.log(
        `Migration complete — modified ${result.modifiedCount} orders.`,
      );
    } catch (error) {
      this.logger.error("Order status migration failed", error);
    }
  }

  // ─── CRUD ──────────────────────────────────────────────────

  async create(userId: string, dto: CreateOrderDto) {
    // Validate stock and discontinued availability for all items
    const stockValidationErrors: { plantId: string; message: string }[] = [];
    
    for (const item of dto.items) {
      const plant = await this.plantsService.getById(item.plantId);
      const plantObj = plant?.data?.plant;
      if (!plantObj) {
        stockValidationErrors.push({
          plantId: item.plantId,
          message: "Sản phẩm không tồn tại",
        });
        continue;
      }

      if (plantObj.availability === "Discontinued") {
        stockValidationErrors.push({
          plantId: item.plantId,
          message: `Sản phẩm "${plantObj.name}" đã ngừng kinh doanh và không thể đặt mua`,
        });
      } else if (item.quantity > plantObj.stock) {
        stockValidationErrors.push({
          plantId: item.plantId,
          message: `Kho hàng chỉ còn ${plantObj.stock} sản phẩm, bạn yêu cầu ${item.quantity}`,
        });
      }
    }
    
    // Return error if any item has insufficient stock or is discontinued
    if (stockValidationErrors.length > 0) {
      return {
        message: "Không đủ hàng hoặc sản phẩm không khả dụng để tạo đơn hàng",
        data: null,
        errors: stockValidationErrors.map(err => ({
          plantId: err.plantId,
          message: err.message,
        })),
      };
    }

    const subtotal = dto.items.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0,
    );

    // Free shipping for orders >= 500k VND
    const shippingFee = subtotal >= 500000 ? 0 : (dto.shippingFee ?? 0);

    let discountInfo: { code: string; amount: number } | undefined;
    let total = subtotal + shippingFee;

    // Apply discount if a code is provided
    if (dto.discountCode && dto.discountAmount && dto.discountAmount > 0) {
      // Capped at subtotal, so discount only subtracts from items, not shipping
      const allowedDiscount = Math.min(dto.discountAmount, subtotal);
      discountInfo = {
        code: dto.discountCode.trim().toUpperCase(),
        amount: allowedDiscount,
      };
      total = (subtotal - allowedDiscount) + shippingFee;
      if (total < 0) total = 0;

      // Increment usage count for the coupon
      await this.discountsService.incrementUsage(dto.discountCode);
    }

    const newOrder = await this.orderModel.create({
      userId,
      orderStatus: "pending",
      paymentStatus: "unpaid",
      total,
      items: dto.items,
      shippingAddress: dto.shippingAddress,
      addressId: dto.addressId,
      shippingFee,
      discount: discountInfo ?? undefined,
      paymentMethod: dto.paymentMethod ?? null,
    });

    // Decrement stock for each ordered item
    for (const item of dto.items) {
      await this.plantsService.decrementStock(item.plantId, item.quantity);
    }

    return {
      message: "Order created",
      data: { order: this.toOrderResponse(newOrder.toObject()) },
    };
  }

  async getAll(query?: {
    page?: number;
    limit?: number;
    search?: string;
    orderStatus?: string;
    paymentStatus?: string;
    deliveryPartnerId?: string;
    userId?: string;
  }) {
    const page = Math.max(1, Number(query?.page ?? 1) || 1);
    const limit = Math.max(1, Number(query?.limit ?? 10) || 10);
    const normalizedSearch = (query?.search ?? "").trim();
    const normalizedOrderStatus = (query?.orderStatus ?? "").trim();
    const normalizedPaymentStatus = (query?.paymentStatus ?? "").trim();
    const normalizedDeliveryPartnerId = (query?.deliveryPartnerId ?? "").trim();
    const normalizedUserId = (query?.userId ?? "").trim();

    const filter: Record<string, unknown> = {};

    if (normalizedOrderStatus) {
      filter.orderStatus = normalizedOrderStatus;
    }

    if (normalizedPaymentStatus) {
      filter.paymentStatus = normalizedPaymentStatus;
    }

    if (normalizedDeliveryPartnerId) {
      filter.deliveryPartnerId = normalizedDeliveryPartnerId;
    }

    if (normalizedUserId) {
      filter.userId = normalizedUserId;
    }

    if (normalizedSearch) {
      const escaped = normalizedSearch.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const regex = new RegExp(escaped, "i");

      const orFilters: Array<Record<string, unknown>> = [
        { userId: { $regex: regex } },
        { shippingAddress: { $regex: regex } },
        { "items.name": { $regex: regex } },
      ];

      if (Types.ObjectId.isValid(normalizedSearch)) {
        orFilters.push({ _id: new Types.ObjectId(normalizedSearch) });
      }

      filter.$or = orFilters;
    }

    const totalResults = await this.orderModel.countDocuments(filter);
    const orders = await this.orderModel
      .find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean();

    return {
      results: orders.length,
      totalResults,
      page,
      totalPages: Math.max(1, Math.ceil(totalResults / limit)),
      data: { orders: orders.map((order) => this.toOrderResponse(order)) },
    };
  }

  async getMyOrders(userId: string) {
    const orders = await this.orderModel
      .find({ userId })
      .sort({ createdAt: -1 })
      .lean();
    return {
      data: { orders: orders.map((order) => this.toOrderResponse(order)) },
    };
  }

  async getMyOrderById(userId: string, orderId: string) {
    const order = await this.orderModel
      .findOne({ _id: orderId, userId })
      .lean();
    return order ? this.toOrderResponse(order) : null;
  }

  async getOrderById(orderId: string) {
    const order = await this.orderModel.findById(orderId).lean();
    return order ? this.toOrderResponse(order) : null;
  }

  async updateOrderStatus(
    orderId: string,
    update: {
      orderStatus?: OrderStatus;
      paymentStatus?: PaymentStatus;
      deliveryPartnerId?: string;
      deliveryPartnerName?: string;
      returnReason?: string;
    },
  ) {
    const setFields: Record<string, unknown> = {};
    if (update.orderStatus) {
      setFields.orderStatus = update.orderStatus;
    }
    if (update.paymentStatus) {
      setFields.paymentStatus = update.paymentStatus;
    }
    if (update.deliveryPartnerId !== undefined) {
      setFields.deliveryPartnerId = update.deliveryPartnerId;
    }
    if (update.deliveryPartnerName !== undefined) {
      setFields.deliveryPartnerName = update.deliveryPartnerName;
    }
    if (update.returnReason !== undefined) {
      setFields.returnReason = update.returnReason;
    }

    // Auto-mark as paid when delivered
    if (update.orderStatus === "delivered") {
      setFields.paymentStatus = "paid";
    }

    if (Object.keys(setFields).length === 0) return null;

    const target = await this.orderModel
      .findByIdAndUpdate(orderId, { $set: setFields }, { new: true })
      .lean();
    return target ? this.toOrderResponse(target) : null;
  }

  async savePaymentInfo(
    orderId: string,
    info: { transactionCode?: string; paymentMethod?: string },
  ) {
    const update: Record<string, unknown> = {};
    if (info.transactionCode) update.transactionCode = info.transactionCode;
    if (info.paymentMethod) update.paymentMethod = info.paymentMethod;

    const target = await this.orderModel
      .findByIdAndUpdate(orderId, update, { new: true })
      .lean();
    return target ? this.toOrderResponse(target) : null;
  }

  async cancelOrder(orderId: string, userId: string) {
    const target = await this.orderModel
      .findOne({ _id: orderId, userId })
      .lean();
    if (!target) return null;

    if (target.orderStatus === "delivered") {
      return "DELIVERED" as const;
    }

    const updated = await this.orderModel
      .findByIdAndUpdate(
        orderId,
        { orderStatus: "cancelled" },
        { new: true },
      )
      .lean();
    return updated ? this.toOrderResponse(updated) : null;
  }

  private toOrderResponse(order: any) {
    return {
      id: String(order._id),
      userId: order.userId,
      orderStatus: order.orderStatus ?? "pending",
      paymentStatus: order.paymentStatus ?? "unpaid",
      total: order.total,
      items: order.items,
      shippingAddress: order.shippingAddress,
      addressId: order.addressId ? String(order.addressId) : undefined,
      shippingFee: order.shippingFee ?? 0,
      discount: order.discount ?? null,
      paymentMethod: order.paymentMethod ?? null,
      transactionCode: order.transactionCode ?? null,
      deliveryPartnerId: order.deliveryPartnerId ?? null,
      deliveryPartnerName: order.deliveryPartnerName ?? null,
      returnReason: order.returnReason ?? null,
      createdAt: toIsoString(order.createdAt),
      updatedAt: toIsoString(order.updatedAt),
    };
  }
}
