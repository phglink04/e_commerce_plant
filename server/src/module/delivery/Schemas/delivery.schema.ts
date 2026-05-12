import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { HydratedDocument, Types } from "mongoose";
@Schema({ timestamps: true })
export class Delivery {
  @Prop({ type: Types.ObjectId, ref: "Order" })
  orderId!: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: "User" })
  deliveryPartnerId!: Types.ObjectId;

  @Prop({ default: "assigned" })
  status!: string;
}

export type DeliveryDocument = HydratedDocument<Delivery>;
export const DeliverySchema = SchemaFactory.createForClass(Delivery);
