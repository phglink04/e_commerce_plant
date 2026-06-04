import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { HydratedDocument } from "mongoose";

export type HomeSettingsDocument = HydratedDocument<HomeSettings>;

// Sub-schema cho từng Section
@Schema({ _id: false })
export class SectionConfig {
  @Prop({ required: true })
  sectionId!: string; // ví dụ: 'hero', 'flash_sale', 'featured_plants', 'blog'

  @Prop({ required: true })
  title!: string;

  @Prop({ default: true })
  isVisible!: boolean;

  @Prop({ required: true })
  order!: number; // Dùng để sort (tráo vị trí lên xuống) trên Frontend

  // Layout riêng cho từng section (nếu áp dụng)
  @Prop({ type: Number, min: 1, max: 6, default: 2 })
  rows!: number;

  @Prop({ type: Number, min: 1, max: 6, default: 4 })
  cols!: number;
}
const SectionConfigSchema = SchemaFactory.createForClass(SectionConfig);

// Sub-schema cho Footer
@Schema({ _id: false })
export class FooterInfo {
  @Prop({ default: "" }) address!: string;
  @Prop({ default: "" }) phone!: string;
  @Prop({ default: "" }) email!: string;
  @Prop({ default: "" }) facebookLink!: string;
}
const FooterInfoSchema = SchemaFactory.createForClass(FooterInfo);

@Schema({ timestamps: true, versionKey: false })
export class HomeSettings {
  @Prop({
    type: String,
    required: false,
    trim: true,
    default: "/frontend/logo/logo.png",
  })
  logo?: string;

  @Prop({
    type: String,
    required: true,
    trim: true,
    default: "Featured Plants",
  })
  heroTitle!: string;

  @Prop({
    type: String,
    required: true,
    trim: true,
    default: "/frontend/Home%20Page/landingImage.webp",
  })
  heroBanner!: string;

  // Mảng chứa cấu hình các section
  @Prop({ type: [SectionConfigSchema], default: [] })
  sections!: SectionConfig[];

  // Object chứa cấu hình riêng cho từng section
  @Prop({
    type: Object,
    default: {},
  })
  sectionConfigs?: Record<string, any>;

  // Object chứa thông tin footer
  @Prop({ type: FooterInfoSchema, default: () => ({}) })
  footerInfo!: FooterInfo;
}

export const HomeSettingsSchema = SchemaFactory.createForClass(HomeSettings);
