import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { HydratedDocument } from "mongoose";

@Schema({ _id: false, timestamps: true })
export class ReviewReply {
  @Prop({ required: true })
  userId!: string;

  @Prop({ required: true })
  userName!: string;

  @Prop({ default: "" })
  userAvatar!: string;

  @Prop({ required: true, maxlength: 2000 })
  content!: string;

  @Prop({ default: false })
  isAdmin!: boolean;
}

const ReviewReplySchema = SchemaFactory.createForClass(ReviewReply);

@Schema({ timestamps: true })
export class Review {
  @Prop({ required: true, index: true })
  userId!: string;

  @Prop({ required: true })
  userName!: string;

  @Prop({ default: "" })
  userAvatar!: string;

  @Prop({ required: true, index: true })
  productId!: string;

  @Prop({ required: true })
  orderId!: string;

  @Prop({ required: true, min: 1, max: 5, index: true })
  rating!: number;

  @Prop({ default: "", maxlength: 5000 })
  content!: string;

  @Prop({ type: [String], default: [] })
  images!: string[];

  @Prop({ default: true })
  isVerifiedPurchase!: boolean;

  @Prop({ default: false })
  isApproved!: boolean;

  @Prop({ default: 0, min: 0 })
  likes!: number;

  @Prop({ type: [String], default: [] })
  likedBy!: string[];

  @Prop({ type: [ReviewReplySchema], default: [] })
  replies!: ReviewReply[];
}

export type ReviewDocument = HydratedDocument<Review>;
export const ReviewSchema = SchemaFactory.createForClass(Review);

// Compound unique index: one review per user per product
ReviewSchema.index({ userId: 1, productId: 1 }, { unique: true });

// Compound index for efficient filtering
ReviewSchema.index({ productId: 1, isApproved: 1, createdAt: -1 });
ReviewSchema.index({ productId: 1, rating: 1 });
