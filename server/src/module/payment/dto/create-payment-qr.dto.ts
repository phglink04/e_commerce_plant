import { IsMongoId } from "class-validator";

export class CreatePaymentQrDto {
  @IsMongoId()
  orderId!: string;
}
