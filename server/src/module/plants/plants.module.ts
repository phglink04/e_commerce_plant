import { Module, forwardRef } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { PlantsController } from "./plants.controller";
import { PlantsService } from "./plants.service";
import { Plant, PlantSchema } from "./schemas/plant.schema";
import { Order, OrderSchema } from "../orders/schemas/order.schema";
import { HelpersModule } from "../../helpers/helpers.module";
import { ChatbotModule } from "../chatbot/chatbot.module";
import { ChatbotService } from "../chatbot/chatbot.service";

@Module({
  imports: [
    HelpersModule,
    MongooseModule.forFeature([
      { name: Plant.name, schema: PlantSchema },
      { name: Order.name, schema: OrderSchema },
    ]),
    forwardRef(() => ChatbotModule),
  ],
  controllers: [PlantsController],
  providers: [
    PlantsService,
    {
      provide: 'CHATBOT_EMBEDDING',
      useFactory: (chatbotService: ChatbotService) => {
        return (text: string) => chatbotService.generateEmbedding(text);
      },
      inject: [{ token: ChatbotService, optional: true }],
    },
  ],
  exports: [PlantsService],
})
export class PlantsModule {}

