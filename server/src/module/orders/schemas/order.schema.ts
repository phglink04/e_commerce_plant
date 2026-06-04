import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { HydratedDocument, Types } from "mongoose";

@Schema({ _id: false })
class OrderItem {
  @Prop({ required: true })
  plantId!: string;

  @Prop({ required: true })
  name!: string;

  @Prop({ required: true, min: 1 })
  quantity!: number;

  @Prop({ required: true, min: 0 })
  price!: number;
}

const OrderItemSchema = SchemaFactory.createForClass(OrderItem);

@Schema({ _id: false })
class OrderDiscount {
  @Prop({ required: true })
  code!: string;

  @Prop({ required: true, min: 0 })
  amount!: number;
}

const OrderDiscountSchema = SchemaFactory.createForClass(OrderDiscount);

@Schema({ timestamps: true })
export class Order {
  @Prop({ required: true, index: true })
  userId!: string;

  @Prop({
    required: true,
    enum: [
      "pending",
      "confirmed",
      "processing",
      "shipped",
      "delivered",
      "cancelled",
      "returned",
    ],
    default: "pending",
  })
  orderStatus!:
    | "pending"
    | "confirmed"
    | "processing"
    | "shipped"
    | "delivered"
    | "cancelled"
    | "returned";

  @Prop({
    required: true,
    enum: ["unpaid", "paid", "failed", "refunded"],
    default: "unpaid",
  })
  paymentStatus!: "unpaid" | "paid" | "failed" | "refunded";

  @Prop({ required: true, min: 0 })
  total!: number;

  @Prop({ type: [OrderItemSchema], default: [] })
  items!: OrderItem[];

  @Prop({ required: true })
  shippingAddress!: string;

  @Prop({ type: Types.ObjectId })
  addressId?: Types.ObjectId;

  @Prop({ type: OrderDiscountSchema, default: null })
  discount?: OrderDiscount;

  @Prop({ type: Number, default: 0, min: 0 })
  shippingFee!: number;

  @Prop({ type: String, enum: ["cash", "qr"], default: null })
  paymentMethod?: string;

  @Prop({ type: String, default: null })
  transactionCode?: string;

  @Prop({ type: String, default: null })
  deliveryPartnerId?: string;

  @Prop({ type: String, default: null })
  deliveryPartnerName?: string;

  @Prop({ type: String, default: null })
  returnReason?: string;
}

export type OrderDocument = HydratedDocument<Order>;
export const OrderSchema = SchemaFactory.createForClass(Order);
