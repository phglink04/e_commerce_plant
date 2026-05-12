import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { HydratedDocument, Types } from "mongoose";
@Schema({ timestamps: true })
export class Payment {
  @Prop({ type: Types.ObjectId, ref: "Order", index: true })
  orderId!: Types.ObjectId;

  @Prop({ required: true })
  method!: string; // QR, COD

  @Prop({ required: true })
  amount!: number;

  @Prop({ default: "Pending" })
  status!: string;

  @Prop({ type: String, default: null })
  transactionId!: string | null;
}

export type PaymentDocument = HydratedDocument<Payment>;
export const PaymentSchema = SchemaFactory.createForClass(Payment);
