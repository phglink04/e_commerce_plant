import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { DiscountsController } from "./discounts.controller";
import { DiscountsService } from "./discounts.service";
import { Discount, DiscountSchema } from "./schemas/discount.schema";
import { Order, OrderSchema } from "../orders/schemas/order.schema";

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Discount.name, schema: DiscountSchema },
      { name: Order.name, schema: OrderSchema },
    ]),
  ],
  controllers: [DiscountsController],
  providers: [DiscountsService],
  exports: [DiscountsService],
})
export class DiscountsModule {}
