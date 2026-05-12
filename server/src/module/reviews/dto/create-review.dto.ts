import {
  IsString,
  IsInt,
  Min,
  Max,
  IsOptional,
  IsArray,
  ArrayMaxSize,
  MaxLength,
  IsNotEmpty,
  ValidateIf,
} from "class-validator";

export class CreateReviewDto {
  @IsString()
  @IsNotEmpty()
  productId!: string;

  @IsString()
  @IsNotEmpty()
  orderId!: string;

  @IsInt()
  @Min(1)
  @Max(5)
  rating!: number;

  @ValidateIf((o) => !o.images || o.images.length === 0)
  @IsString()
  @IsNotEmpty({ message: "Content is required when no images are provided" })
  @MaxLength(5000)
  @IsOptional()
  content?: string;

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(5, { message: "Maximum 5 images allowed" })
  @IsString({ each: true })
  images?: string[];
}
