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
  @IsIn(["unpaid", "paid", "failed", "refunded"])
  paymentStatus?: "unpaid" | "paid" | "failed" | "refunded";
}
