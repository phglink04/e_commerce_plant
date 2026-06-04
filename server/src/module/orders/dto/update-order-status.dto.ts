import { IsIn, IsOptional, IsString } from "class-validator";

export class UpdateOrderStatusDto {
  @IsOptional()
  @IsString()
  @IsIn([
    "pending",
    "confirmed",
    "processing",
    "shipped",
    "delivered",
    "cancelled",
    "returned",
  ])
  orderStatus?:
    | "pending"
    | "confirmed"
    | "processing"
    | "shipped"
    | "delivered"
    | "cancelled"
    | "returned";

  @IsOptional()
  @IsString()
  paymentStatus?: "unpaid" | "paid" | "failed" | "refunded";

  @IsOptional()
  @IsString()
  deliveryPartnerId?: string;

  @IsOptional()
  @IsString()
  deliveryPartnerName?: string;

  @IsOptional()
  @IsString()
  returnReason?: string;
}
