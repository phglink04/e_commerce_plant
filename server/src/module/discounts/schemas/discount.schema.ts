import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { HydratedDocument } from "mongoose";

export type DiscountType = "percentage" | "fixed";

@Schema({ timestamps: true })
export class Discount {
  @Prop({ required: true, unique: true, uppercase: true, trim: true })
  code!: string;

  @Prop({ required: true, enum: ["percentage", "fixed"] })
  type!: DiscountType;

  @Prop({ required: true, min: 0 })
  value!: number;

  @Prop({ required: true, min: 0 })
  minOrderValue!: number;

  @Prop({ min: 0 })
  maxDiscount?: number;

  @Prop({ required: true, min: 1 })
  usageLimit!: number;

  @Prop({ default: 0, min: 0 })
  usedCount!: number;

  @Prop({ required: true })
  startDate!: Date;

  @Prop({ required: true })
  endDate!: Date;

  @Prop({ default: true })
  isActive!: boolean;

  @Prop({ type: [String], default: [] })
  applicableCategories!: string[];

  @Prop({ type: [String], default: [] })
  applicableProducts!: string[];
}

export type DiscountDocument = HydratedDocument<Discount>;
export const DiscountSchema = SchemaFactory.createForClass(Discount);
