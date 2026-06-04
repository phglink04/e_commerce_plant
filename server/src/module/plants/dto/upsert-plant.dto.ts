import {
  IsIn,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  Min,
} from "class-validator";
import { Type } from "class-transformer";
import { Transform } from "class-transformer";
import { IsBoolean } from "class-validator";

export class UpsertPlantDto {
  @IsString()
  name!: string;

  @Type(() => Number)
  @IsNumber()
  @Min(1, { message: 'Giá bán phải lớn hơn 0' })
  price!: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  costPrice?: number;

  @IsOptional()
  @IsString()
  imageCover?: string;

  @IsString()
  category!: string;

  @IsOptional()
  @IsString({ each: true })
  tags?: string[];

  @IsString()
  @IsIn(["In Stock", "Out Of Stock", "Discontinued"])
  availability!: "In Stock" | "Out Of Stock" | "Discontinued";

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  stock?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @Max(100)
  discountPercentage?: number;

  @IsOptional()
  @Transform(({ value }) => value === "true" || value === true)
  @IsBoolean()
  isFeatured?: boolean;

  @IsOptional()
  @Transform(({ value }) => value === "true" || value === true)
  @IsBoolean()
  isFlashSale?: boolean;
}
