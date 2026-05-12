import { IsMongoId } from "class-validator";
export class AssignDeliveryDto {
  @IsMongoId()
  orderId: string = "";

  @IsMongoId()
  deliveryPartnerId: string = "";
}
