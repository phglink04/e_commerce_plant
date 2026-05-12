import { IsNumber, IsString, Min } from "class-validator";

export class AddToCartDto {
  @IsString()
  plantId!: string;

  @IsNumber()
  @Min(1)
  quantity!: number;

  @IsNumber()
  @Min(0)
  price!: number;
}
