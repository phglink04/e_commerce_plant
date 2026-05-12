import { IsMongoId, IsNumber, IsString, Min } from "class-validator";

export class CheckPaymentDto {
  @IsString()
  transactionCode!: string;

  @IsNumber()
  @Min(1)
  amount!: number;

  @IsMongoId()
  orderId!: string;
}
