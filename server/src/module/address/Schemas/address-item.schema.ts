import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";

@Schema({ _id: false })
export class AddressItem {
  @Prop({ required: true })
  id!: string;

  @Prop({ required: true })
  fullName!: string;

  @Prop({ required: true })
  phone!: string;

  @Prop({ default: "" })
  city?: string;

  @Prop({ default: "" })
  district?: string;

  @Prop({ default: "" })
  ward?: string;

  @Prop({ required: true })
  addressLine!: string;

  @Prop({ default: false })
  isDefault?: boolean;
}

export const AddressItemSchema = SchemaFactory.createForClass(AddressItem);
