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

/**
 * Sanitise a string for use in a coupon code:
 * remove whitespace & special chars, uppercase.
 */
const sanitiseCodePart = (raw: string): string =>
  raw
    .replace(/[^a-zA-Z0-9]/g, "")
    .toUpperCase();

@Injectable()
export class DiscountsService {
  constructor(
    @InjectModel(Discount.name)
    private readonly discountModel: Model<Discount>,
  ) {}

  /**
   * Create a new discount code (admin).
   * The final code is auto-generated: SANITISE(name) + percentage.
   */
  async create(dto: CreateDiscountDto) {
    // Validate dates
    const start = new Date(dto.startDate);
    const end = new Date(dto.endDate);
    const now = new Date();

    if (end <= start) {
      throw new BadRequestException(
        "Ngày kết thúc phải lớn hơn ngày bắt đầu",
      );
    }
    if (end <= now) {
      throw new BadRequestException(
        "Không thể tạo mã đã hết hạn",
      );
    }

    // Generate the final code
    const namePart = sanitiseCodePart(dto.name);
    if (!namePart) {
      throw new BadRequestException("Tên mã không hợp lệ");
    }
    const code = `${namePart}${dto.percentage}`;

    // Check for duplicates
    const existing = await this.discountModel.findOne({ code });
    if (existing) {
      throw new ConflictException(`Mã giảm giá "${code}" đã tồn tại`);
    }

    const discount = await this.discountModel.create({
      name: dto.name.trim(),
      code,
      percentage: dto.percentage,
      minOrderValue: dto.minOrderValue,
      maxDiscount: dto.maxDiscount ?? undefined,
      usageLimit: dto.usageLimit,
      usedCount: 0,
      startDate: start,
      endDate: end,
      isActive: dto.isActive ?? true,
      isVisible: dto.isVisible ?? true,
    });

    return {
      message: "Discount created",
      data: { discount: this.toResponse(discount.toObject()) },
    };
  }

  /**
   * List all discounts (admin) with pagination.
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
      filter.$or = [
        { code: { $regex: new RegExp(escaped, "i") } },
        { name: { $regex: new RegExp(escaped, "i") } },
      ];
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
   * Get visible vouchers (user-facing).
   * Only returns active, non-expired, within-usage-limit, isVisible coupons.
   */
  async getVisible() {
    const now = new Date();
    const discounts = await this.discountModel
      .find({
        isActive: true,
        isVisible: true,
        startDate: { $lte: now },
        endDate: { $gte: now },
        $expr: { $lt: ["$usedCount", "$usageLimit"] },
      })
      .sort({ createdAt: -1 })
      .lean();

    return {
      data: {
        discounts: discounts.map((d) => this.toResponse(d)),
      },
    };
  }

  /**
   * Get a single discount by ID (admin).
   */
  async getById(id: string) {
    const discount = await this.discountModel.findById(id).lean();
    if (!discount) {
      throw new NotFoundException("Discount not found");
    }
    return { data: { discount: this.toResponse(discount) } };
  }

  /**
   * Update a discount (admin).
   * If name or percentage changes, re-generate the code.
   */
  async update(id: string, dto: UpdateDiscountDto) {
    const existing = await this.discountModel.findById(id);
    if (!existing) {
      throw new NotFoundException("Discount not found");
    }

    // Validate dates if provided
    const startDate = dto.startDate
      ? new Date(dto.startDate)
      : existing.startDate;
    const endDate = dto.endDate ? new Date(dto.endDate) : existing.endDate;

    if (endDate <= startDate) {
      throw new BadRequestException(
        "Ngày kết thúc phải lớn hơn ngày bắt đầu",
      );
    }

    const updateData: Record<string, unknown> = { ...dto };

    // Re-generate code if name or percentage changed
    const newName = dto.name ?? existing.name;
    const newPct = dto.percentage ?? existing.percentage;
    const namePart = sanitiseCodePart(newName);
    if (!namePart) {
      throw new BadRequestException("Tên mã không hợp lệ");
    }
    const newCode = `${namePart}${newPct}`;

    if (newCode !== existing.code) {
      // Check uniqueness
      const dup = await this.discountModel.findOne({
        code: newCode,
        _id: { $ne: id },
      });
      if (dup) {
        throw new ConflictException(`Mã giảm giá "${newCode}" đã tồn tại`);
      }
      updateData.code = newCode;
    }

    // Persist name as-is (trimmed)
    if (dto.name) {
      updateData.name = dto.name.trim();
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
   * Delete a discount (admin).
   */
  async remove(id: string) {
    const discount = await this.discountModel.findByIdAndDelete(id).lean();
    if (!discount) {
      throw new NotFoundException("Discount not found");
    }
    return { message: "Discount deleted" };
  }

  /**
   * Apply a discount code (user-facing).
   * Validates all conditions and returns the calculated discount.
   */
  async apply(dto: ApplyDiscountDto) {
    const codeUpper = dto.code.trim().toUpperCase();
    const { cartTotal } = dto;

    const discount = await this.discountModel.findOne({ code: codeUpper });

    if (!discount) {
      throw new BadRequestException("Mã giảm giá không hợp lệ");
    }

    // Check if active
    if (!discount.isActive) {
      throw new BadRequestException("Mã giảm giá đã bị vô hiệu hóa");
    }

    // Check date range
    const now = new Date();
    if (now < new Date(discount.startDate)) {
      throw new BadRequestException("Mã giảm giá chưa có hiệu lực");
    }
    if (now > new Date(discount.endDate)) {
      throw new BadRequestException("Mã giảm giá đã hết hạn");
    }

    // Check usage limit
    if (discount.usedCount >= discount.usageLimit) {
      throw new BadRequestException("Mã giảm giá đã hết lượt sử dụng");
    }

    // Check minimum order value
    if (cartTotal < discount.minOrderValue) {
      throw new BadRequestException(
        `Đơn hàng tối thiểu ${discount.minOrderValue.toLocaleString("vi-VN")}₫`,
      );
    }

    // Calculate discount amount (always percentage-based)
    let discountAmount = Math.round((cartTotal * discount.percentage) / 100);

    // Cap at maxDiscount if set
    if (discount.maxDiscount && discountAmount > discount.maxDiscount) {
      discountAmount = discount.maxDiscount;
    }

    // Ensure discount doesn't exceed cart total
    if (discountAmount > cartTotal) {
      discountAmount = cartTotal;
    }

    const finalTotal = cartTotal - discountAmount;

    return {
      valid: true,
      code: codeUpper,
      percentage: discount.percentage,
      discountAmount,
      finalTotal,
      message: `Giảm ${discount.percentage}% thành công`,
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
      name: discount.name ?? "",
      code: discount.code,
      percentage: discount.percentage ?? discount.value ?? 0,
      minOrderValue: discount.minOrderValue,
      maxDiscount: discount.maxDiscount ?? null,
      usageLimit: discount.usageLimit,
      usedCount: discount.usedCount,
      startDate: toIsoString(discount.startDate),
      endDate: toIsoString(discount.endDate),
      isActive: discount.isActive,
      isVisible: discount.isVisible ?? true,
      createdAt: toIsoString(discount.createdAt),
      updatedAt: toIsoString(discount.updatedAt),
    };
  }
}
