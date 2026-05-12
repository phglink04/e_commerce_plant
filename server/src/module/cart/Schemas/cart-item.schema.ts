import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Types } from "mongoose";

@Schema({ _id: false })
export class CartItem {
  @Prop({ type: Types.ObjectId, ref: "Plant", required: true })
  plantId!: Types.ObjectId;

  @Prop({ required: true, min: 1 })
  quantity!: number;

  @Prop({ required: true })
  price!: number;
}

export const CartItemSchema = SchemaFactory.createForClass(CartItem);
