import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { Discount } from "./schemas/discount.schema";
import { CreateDiscountDto } from "./dto/create-discount.dto";
import { UpdateDiscountDto } from "./dto/update-discount.dto";
import { ApplyDiscountDto } from "./dto/apply-discount.dto";

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
export class DiscountsService {
  constructor(
    @InjectModel(Discount.name)
    private readonly discountModel: Model<Discount>,
  ) {}

  /**
   * Create a new discount code (admin)
   */
  async create(dto: CreateDiscountDto) {
    const codeUpper = dto.code.trim().toUpperCase();

    const existing = await this.discountModel.findOne({ code: codeUpper });
    if (existing) {
      throw new ConflictException(`Discount code "${codeUpper}" already exists`);
    }

    const discount = await this.discountModel.create({
      ...dto,
      code: codeUpper,
      usedCount: 0,
    });

    return {
      message: "Discount created",
      data: { discount: this.toResponse(discount.toObject()) },
    };
  }

  /**
   * List all discounts (admin) with pagination
   */
  async getAll(query?: {
    page?: number;
    limit?: number;
    search?: string;
    status?: string;
  }) {
    const page = Math.max(1, Number(query?.page ?? 1) || 1);
    const limit = Math.max(1, Number(query?.limit ?? 10) || 10);
    const normalizedSearch = (query?.search ?? "").trim();
    const normalizedStatus = (query?.status ?? "").trim();

    const filter: Record<string, unknown> = {};

    if (normalizedStatus === "active") {
      filter.isActive = true;
    } else if (normalizedStatus === "inactive") {
      filter.isActive = false;
    }

    if (normalizedSearch) {
      const escaped = normalizedSearch.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      filter.code = { $regex: new RegExp(escaped, "i") };
    }

    const totalResults = await this.discountModel.countDocuments(filter);
    const discounts = await this.discountModel
      .find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean();

    return {
      results: discounts.length,
      totalResults,
      page,
      totalPages: Math.max(1, Math.ceil(totalResults / limit)),
      data: {
        discounts: discounts.map((d) => this.toResponse(d)),
      },
    };
  }

  /**
   * Get a single discount by ID (admin)
   */
  async getById(id: string) {
    const discount = await this.discountModel.findById(id).lean();
    if (!discount) {
      throw new NotFoundException("Discount not found");
    }
    return { data: { discount: this.toResponse(discount) } };
  }

  /**
   * Update a discount (admin)
   */
  async update(id: string, dto: UpdateDiscountDto) {
    const updateData: Record<string, unknown> = { ...dto };

    // If code is being updated, uppercase it and check for conflicts
    if (dto.code) {
      const codeUpper = dto.code.trim().toUpperCase();
      const existing = await this.discountModel.findOne({
        code: codeUpper,
        _id: { $ne: id },
      });
      if (existing) {
        throw new ConflictException(
          `Discount code "${codeUpper}" already exists`,
        );
      }
      updateData.code = codeUpper;
    }

    const discount = await this.discountModel
      .findByIdAndUpdate(id, updateData, { new: true })
      .lean();

    if (!discount) {
      throw new NotFoundException("Discount not found");
    }

    return {
      message: "Discount updated",
      data: { discount: this.toResponse(discount) },
    };
  }

  /**
   * Delete a discount (admin)
   */
  async remove(id: string) {
    const discount = await this.discountModel.findByIdAndDelete(id).lean();
    if (!discount) {
      throw new NotFoundException("Discount not found");
    }
    return { message: "Discount deleted" };
  }

  /**
   * Apply a discount code (user-facing)
   * Validates all conditions and returns the calculated discount
   */
  async apply(dto: ApplyDiscountDto) {
    const codeUpper = dto.code.trim().toUpperCase();
    const { cartTotal } = dto;

    const discount = await this.discountModel.findOne({ code: codeUpper });

    if (!discount) {
      throw new BadRequestException("Invalid discount code");
    }

    // Check if active
    if (!discount.isActive) {
      throw new BadRequestException("This discount code is no longer active");
    }

    // Check date range
    const now = new Date();
    if (now < new Date(discount.startDate)) {
      throw new BadRequestException("This discount code is not yet available");
    }
    if (now > new Date(discount.endDate)) {
      throw new BadRequestException("This discount code has expired");
    }

    // Check usage limit
    if (discount.usedCount >= discount.usageLimit) {
      throw new BadRequestException(
        "This discount code has reached its usage limit",
      );
    }

    // Check minimum order value
    if (cartTotal < discount.minOrderValue) {
      throw new BadRequestException(
        `Minimum order value is ${discount.minOrderValue.toLocaleString()} VND`,
      );
    }

    // Calculate discount amount
    let discountAmount: number;

    if (discount.type === "percentage") {
      discountAmount = Math.round((cartTotal * discount.value) / 100);
      // Cap at maxDiscount if set
      if (discount.maxDiscount && discountAmount > discount.maxDiscount) {
        discountAmount = discount.maxDiscount;
      }
    } else {
      // Fixed discount
      discountAmount = discount.value;
    }

    // Ensure discount doesn't exceed cart total
    if (discountAmount > cartTotal) {
      discountAmount = cartTotal;
    }

    const finalTotal = cartTotal - discountAmount;

    return {
      valid: true,
      code: codeUpper,
      type: discount.type,
      discountAmount,
      finalTotal,
      message: "Discount applied successfully",
    };
  }

  /**
   * Increment usedCount after an order is successfully placed.
   * Called from the order flow.
   */
  async incrementUsage(code: string) {
    const codeUpper = code.trim().toUpperCase();
    await this.discountModel.findOneAndUpdate(
      { code: codeUpper },
      { $inc: { usedCount: 1 } },
    );
  }

  private toResponse(discount: Record<string, any>) {
    return {
      id: String(discount._id),
      code: discount.code,
      type: discount.type,
      value: discount.value,
      minOrderValue: discount.minOrderValue,
      maxDiscount: discount.maxDiscount ?? null,
      usageLimit: discount.usageLimit,
      usedCount: discount.usedCount,
      startDate: toIsoString(discount.startDate),
      endDate: toIsoString(discount.endDate),
      isActive: discount.isActive,
      applicableCategories: discount.applicableCategories ?? [],
      applicableProducts: discount.applicableProducts ?? [],
      createdAt: toIsoString(discount.createdAt),
      updatedAt: toIsoString(discount.updatedAt),
    };
  }
}
