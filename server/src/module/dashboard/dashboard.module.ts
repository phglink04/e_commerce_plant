import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { DashboardController } from "./dashboard.controller";
import { DashboardService } from "./dashboard.service";
import { DashboardStatSchema } from "./schemas/dashboard.schema";
import { OrderSchema } from "../orders/schemas/order.schema";
import { PlantSchema } from "../plants/schemas/plant.schema";
import { UserSchema } from "../users/schemas/user.schema";
import { ReviewSchema } from "../reviews/schemas/review.schema";

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: "DashboardStat", schema: DashboardStatSchema },
      { name: "Order", schema: OrderSchema },
      { name: "Plant", schema: PlantSchema },
      { name: "User", schema: UserSchema },
      { name: "Review", schema: ReviewSchema },
    ]),
  ],
  controllers: [DashboardController],
  providers: [DashboardService],
  exports: [DashboardService],
})
export class DashboardModule {}

