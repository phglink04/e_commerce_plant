import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { HydratedDocument } from "mongoose";

@Schema({ timestamps: true })
export class Category {
  @Prop({ required: true, trim: true, unique: true })
  name!: string;

  @Prop({ required: true, trim: true, unique: true })
  slug!: string;

  @Prop({ default: "" })
  description!: string;

  @Prop({ default: true })
  isActive!: boolean;
}

export type CategoryDocument = HydratedDocument<Category>;
export const CategorySchema = SchemaFactory.createForClass(Category);
