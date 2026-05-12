import { IsNumber, IsOptional, IsString, Min } from "class-validator";

export class UpdateCartDto {
  @IsString()
  plantId!: string;

  @IsNumber()
  @Min(1)
  quantity!: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  price?: number;
}
