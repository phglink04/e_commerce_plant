import {
  IsString,
  IsNumber,
  IsBoolean,
  IsOptional,
  IsDateString,
  Min,
  Max,
  MaxLength,
  ValidateIf,
} from "class-validator";

export class CreateDiscountDto {
  /** Admin-friendly name (e.g. "sale", "summer") */
  @IsString()
  @MaxLength(50)
  name!: string;

  /** Discount percentage 1–100 */
  @IsNumber()
  @Min(1, { message: "Phần trăm giảm giá phải lớn hơn 0" })
  @Max(100, { message: "Phần trăm giảm giá tối đa 100" })
  percentage!: number;

  @IsNumber()
  @Min(0)
  minOrderValue!: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  maxDiscount?: number;

  /** Total usage limit. null or omit = unlimited */
  @IsOptional()
  @ValidateIf((o) => o.usageLimit !== null)
  @IsNumber()
  @Min(1)
  usageLimit?: number | null;

  /** Per-user usage limit. null or omit = unlimited */
  @IsOptional()
  @ValidateIf((o) => o.usageLimitPerUser !== null)
  @IsNumber()
  @Min(1)
  usageLimitPerUser?: number | null;

  /** Start date. null or omit = immediately active */
  @IsOptional()
  @ValidateIf((o) => o.startDate !== null)
  @IsDateString()
  startDate?: string | null;

  /** End date. null or omit = never expires */
  @IsOptional()
  @ValidateIf((o) => o.endDate !== null)
  @IsDateString()
  endDate?: string | null;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsBoolean()
  isVisible?: boolean;
}
