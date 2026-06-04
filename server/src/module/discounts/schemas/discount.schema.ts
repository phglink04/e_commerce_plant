import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { HydratedDocument } from "mongoose";

@Schema({ timestamps: true })
export class Discount {
  /** Admin-friendly label (e.g. "summer", "newuser") */
  @Prop({ required: true, trim: true })
  name!: string;

  /**
   * Final coupon code = NAME (sanitised, uppercased) + percentage.
   * e.g. name="sale", percentage=50 → code="SALE50"
   */
  @Prop({ required: true, unique: true, uppercase: true, trim: true })
  code!: string;

  /** Discount percentage (1–100) */
  @Prop({ required: true, min: 1, max: 100 })
  percentage!: number;

  @Prop({ required: true, min: 0, default: 0 })
  minOrderValue!: number;

  /** Maximum discount amount in VND (optional cap) */
  @Prop({ min: 0 })
  maxDiscount?: number;

  /** Total usage limit. null = unlimited */
  @Prop({ type: Number, default: null, min: 1 })
  usageLimit!: number | null;

  @Prop({ default: 0, min: 0 })
  usedCount!: number;

  /** Per-user usage limit. null = unlimited */
  @Prop({ type: Number, default: null, min: 1 })
  usageLimitPerUser!: number | null;

  /** Start date. null = no start date restriction */
  @Prop({ type: Date, default: null })
  startDate!: Date | null;

  /** End date. null = no end date restriction (never expires) */
  @Prop({ type: Date, default: null })
  endDate!: Date | null;

  @Prop({ default: true })
  isActive!: boolean;

  /** Whether this voucher shows up in the user's quick-pick list */
  @Prop({ default: true })
  isVisible!: boolean;
}

export type DiscountDocument = HydratedDocument<Discount>;
export const DiscountSchema = SchemaFactory.createForClass(Discount);
