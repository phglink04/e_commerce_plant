import {
  IsString,
  IsNumber,
  IsBoolean,
  IsOptional,
  IsDateString,
  Min,
  Max,
  MaxLength,
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

  @IsNumber()
  @Min(1)
  usageLimit!: number;

  @IsDateString()
  startDate!: string;

  @IsDateString()
  endDate!: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsBoolean()
  isVisible?: boolean;
}
