import { IsString, IsNumber, Min, MaxLength } from "class-validator";

export class ApplyDiscountDto {
  @IsString()
  @MaxLength(50)
  code!: string;

  @IsNumber()
  @Min(0)
  cartTotal!: number;
}
