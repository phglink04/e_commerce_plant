import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { HydratedDocument } from "mongoose";

@Schema({ timestamps: true })
export class Blog {
  @Prop({ required: true, trim: true })
  title!: string;

  @Prop({
    required: true,
    unique: true,
    trim: true,
    lowercase: true,
    index: true,
  })
  slug!: string;

  @Prop({ required: true })
  content!: string;

  @Prop({ default: "" })
  excerpt!: string;

  @Prop({ required: true })
  coverImage!: string;

  @Prop({ default: "General" })
  category!: string;

  @Prop({ type: [String], default: [] })
  tags!: string[];

  @Prop({ default: "draft", enum: ["draft", "published", "archived"] })
  status!: "draft" | "published" | "archived";

  @Prop({ default: "" })
  author!: string;

  @Prop({ default: false })
  isFeatured: boolean = false;

  @Prop({ default: 0 })
  viewCount!: number;
}

export type BlogDocument = HydratedDocument<Blog>;
export const BlogSchema = SchemaFactory.createForClass(Blog);
