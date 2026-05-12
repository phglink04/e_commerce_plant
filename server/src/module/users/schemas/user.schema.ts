import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { HydratedDocument } from "mongoose";
import { CartItem, CartItemSchema } from "../../cart/Schemas/cart-item.schema";
@Schema({ timestamps: true })
export class User {
  @Prop({ required: true })
  name!: string;

  @Prop({ required: true, unique: true, lowercase: true, trim: true })
  email!: string;

  @Prop({ required: true, enum: ["LOCAL", "GOOGLE"], default: "LOCAL" })
  accountType!: "LOCAL" | "GOOGLE";

  @Prop({ type: String, default: null })
  googleId!: string | null;

  @Prop({
    required: true,
    enum: ["user", "admin", "owner", "deliverypartner"],
    default: "user",
  })
  role!: "user" | "admin" | "owner" | "deliverypartner";

  @Prop({ type: String, default: null })
  phone!: string | null;

  @Prop({ type: String, default: null })
  avatar!: string | null;

  @Prop({ type: Boolean, default: true })
  isActive!: boolean;

  @Prop({ required: true })
  passwordHash!: string;

  @Prop({ default: false })
  isVerified!: boolean;

  @Prop({ type: String, default: null })
  verificationCode!: string | null;

  @Prop({ type: String, default: null })
  verificationCodeExpiresAt!: string | null;

  @Prop({ type: String, default: null, index: true })
  resetToken!: string | null;

  @Prop({ type: String, default: null })
  resetTokenExpiresAt!: string | null;

  @Prop({ type: Boolean, default: false })
  isTwoFactorEnabled!: boolean;

  @Prop({ type: String, default: null })
  twoFactorSecret!: string | null;

  @Prop({ type: [String], default: [] })
  backupCodes!: string[];

  @Prop({ type: [CartItemSchema], default: [] })
  cart!: CartItem[];
}

export type UserDocument = HydratedDocument<User>;
export const UserSchema = SchemaFactory.createForClass(User);
