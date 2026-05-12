import {
  IsString,
  IsEnum,
  IsNumber,
  IsBoolean,
  IsOptional,
  IsDateString,
  IsArray,
  Min,
  MaxLength,
} from "class-validator";

export class CreateDiscountDto {
  @IsString()
  @MaxLength(50)
  code!: string;

  @IsEnum(["percentage", "fixed"])
  type!: "percentage" | "fixed";

  @IsNumber()
  @Min(0)
  value!: number;

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
  @IsArray()
  @IsString({ each: true })
  applicableCategories?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  applicableProducts?: string[];
}
