import {
  IsInt,
  IsOptional,
  IsString,
  Max,
  Min,
  IsBoolean,
  ValidateNested,
  IsArray,
  IsNumber,
} from "class-validator";
import { Type } from "class-transformer";

export class UpdateSectionDto {
  @IsString()
  sectionId!: string;

  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsBoolean()
  isVisible?: boolean;

  @IsOptional()
  @IsInt()
  order?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(6)
  rows?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(6)
  cols?: number;
}

export class UpdateFooterInfoDto {
  @IsOptional()
  @IsString()
  address?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsString()
  email?: string;

  @IsOptional()
  @IsString()
  facebookLink?: string;
}

// ── Section config DTOs ──

/** Hero: title, subtitle, bannerImage */
export class HeroConfigDto {
  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  subtitle?: string;

  @IsOptional()
  @IsString()
  bannerImage?: string;

  // Backward-compat: old fields still accepted but optional
  @IsOptional()
  @IsString()
  ctaText?: string;

  @IsOptional()
  @IsString()
  ctaLink?: string;

  @IsOptional()
  @IsString()
  secondaryCtaText?: string;

  @IsOptional()
  @IsString()
  secondaryCtaLink?: string;

  @IsOptional()
  @IsString()
  badge?: string;
}

/** Sale / Featured / Categories: rows & columns grid config */
export class GridConfigDto {
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(6)
  rows?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(6)
  columns?: number;

  // Backward-compat: old fields still accepted but optional
  @IsOptional()
  @IsString()
  heading?: string;

  @IsOptional()
  @IsString()
  subheading?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(24)
  maxProducts?: number;
}

/** Sale section: extends GridConfigDto with countdown + discount */
export class SaleConfigDto extends GridConfigDto {
  @IsOptional()
  @IsString()
  countdownEndDate?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(99)
  discountPercent?: number;
}

/** Review: perPage and maxTotal */
export class ReviewConfigDto {
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(10)
  perPage?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(50)
  maxTotal?: number;

  // Backward-compat: old fields still accepted but optional
  @IsOptional()
  @IsString()
  heading?: string;

  @IsOptional()
  @IsString()
  subheading?: string;

  @IsOptional()
  @IsNumber()
  autoplayInterval?: number;
}

/** WhyChooseUs — no config, but keep DTO for backward-compat */
export class WhyChooseUsConfigDto {
  @IsOptional()
  @IsString()
  heading?: string;

  @IsOptional()
  @IsString()
  subheading?: string;

  @IsOptional()
  @IsArray()
  features?: Array<{
    id?: string;
    title?: string;
    text?: string;
    iconName?: string;
    description?: string;
  }>;
}

/** Blog — no config, but keep DTO for backward-compat */
export class BlogConfigDto {
  @IsOptional()
  @IsString()
  heading?: string;

  @IsOptional()
  @IsString()
  subheading?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(12)
  maxPosts?: number;
}

/** Newsletter — no config, but keep DTO for backward-compat */
export class NewsletterConfigDto {
  @IsOptional()
  @IsString()
  heading?: string;

  @IsOptional()
  @IsString()
  subheading?: string;

  @IsOptional()
  @IsString()
  ctaText?: string;

  @IsOptional()
  @IsString()
  placeholder?: string;
}

export class UpdateSectionConfigsDto {
  @IsOptional()
  @ValidateNested()
  @Type(() => HeroConfigDto)
  hero?: HeroConfigDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => GridConfigDto)
  categories?: GridConfigDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => SaleConfigDto)
  saleProducts?: SaleConfigDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => GridConfigDto)
  featuredProducts?: GridConfigDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => WhyChooseUsConfigDto)
  whyChooseUs?: WhyChooseUsConfigDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => BlogConfigDto)
  blogSection?: BlogConfigDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => ReviewConfigDto)
  reviewCarousel?: ReviewConfigDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => NewsletterConfigDto)
  newsletter?: NewsletterConfigDto;
}

export class UpdateHomeSettingsDto {
  @IsOptional()
  @IsString()
  heroTitle?: string;

  @IsOptional()
  @IsString()
  heroBanner?: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => UpdateSectionDto)
  sections?: UpdateSectionDto[];

  @IsOptional()
  @ValidateNested()
  @Type(() => UpdateSectionConfigsDto)
  sectionConfigs?: UpdateSectionConfigsDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => UpdateFooterInfoDto)
  footerInfo?: UpdateFooterInfoDto;
}
