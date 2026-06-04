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

export class UpdateDiscountDto {
  @IsOptional()
  @IsString()
  @MaxLength(50)
  name?: string;

  @IsOptional()
  @IsNumber()
  @Min(1, { message: "Phần trăm giảm giá phải lớn hơn 0" })
  @Max(100, { message: "Phần trăm giảm giá tối đa 100" })
  percentage?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  minOrderValue?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  maxDiscount?: number;

  @IsOptional()
  @ValidateIf((o) => o.usageLimit !== null)
  @IsNumber()
  @Min(1)
  usageLimit?: number | null;

  @IsOptional()
  @ValidateIf((o) => o.usageLimitPerUser !== null)
  @IsNumber()
  @Min(1)
  usageLimitPerUser?: number | null;

  @IsOptional()
  @ValidateIf((o) => o.startDate !== null)
  @IsDateString()
  startDate?: string | null;

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
