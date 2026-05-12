import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { HydratedDocument, Types } from "mongoose";
@Schema({ timestamps: true })
export class Address {
  @Prop({ type: Types.ObjectId, ref: "User", required: true, index: true })
  userId!: Types.ObjectId;

  @Prop({ required: true })
  fullName!: string;

  @Prop({ required: true })
  phone!: string;

  @Prop({ required: true })
  city!: string;

  @Prop({ required: true })
  district!: string;

  @Prop({ required: true })
  ward!: string;

  @Prop({ required: true })
  addressLine!: string;

  @Prop({ default: false })
  isDefault!: boolean;
}

export type AddressDocument = HydratedDocument<Address>;
export const AddressSchema = SchemaFactory.createForClass(Address);
