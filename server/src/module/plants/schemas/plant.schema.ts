import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { HydratedDocument } from "mongoose";

@Schema({ timestamps: true })
export class Plant {
  @Prop({ required: true, trim: true })
  name!: string;

  @Prop({ default: "", trim: true, lowercase: true, index: true })
  normalizedName!: string;

  @Prop({
    required: true,
    unique: true,
    trim: true,
    lowercase: true,
    index: true,
  })
  slug!: string;

  @Prop({ required: true, min: 0 })
  price!: number;

  @Prop({ default: 0, min: 0 })
  costPrice!: number;

  @Prop({ default: false })
  isFeatured: boolean = false;

  @Prop({ default: false })
  isFlashSale: boolean = false;

  @Prop({ default: 0 })
  discountPercentage!: number;

  @Prop({ required: true })
  imageCover!: string;

  @Prop({ required: true })
  category!: string;

  @Prop({ type: [String], default: [] })
  tags!: string[];

  @Prop({ required: true, enum: ["In Stock", "Out Of Stock", "Up Coming", "Discontinued"] })
  availability!: "In Stock" | "Out Of Stock" | "Up Coming" | "Discontinued";

  @Prop({ default: 0 })
  stock!: number;

  @Prop({ default: "" })
  description!: string;

  @Prop({ default: 0 })
  rating!: number;

  /**
   * Vector embedding (768 chiều) cho semantic search
   * Được generate tự động bởi Gemini Embedding API
   */
  @Prop({ type: [Number], default: [] })
  embedding!: number[];
}

export type PlantDocument = HydratedDocument<Plant>;
export const PlantSchema = SchemaFactory.createForClass(Plant);

// Text index cho full-text search (Atlas Search fallback)
PlantSchema.index(
  { name: 'text', description: 'text', category: 'text', tags: 'text' },
  {
    weights: { name: 10, category: 5, tags: 3, description: 1 },
    name: 'plant_text_search',
    default_language: 'none', // Không dùng stemming vì data mix VN/EN
  },
);
