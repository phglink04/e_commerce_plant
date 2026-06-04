import { Module, forwardRef } from '@nestjs/common';
import { ChatbotController } from './chatbot.controller';
import { ChatbotService } from './chatbot.service';
import { ChatGateway } from './chat.gateway';
import { MongooseModule } from '@nestjs/mongoose';
import { Chatbot, ChatbotSchema } from './schemas/chatbot.schema';
import { ConfigModule } from '@nestjs/config';
import { PlantsModule } from '../plants/plants.module';
import { Plant, PlantSchema } from '../plants/schemas/plant.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Chatbot.name, schema: ChatbotSchema },
      { name: Plant.name, schema: PlantSchema },
    ]),
    ConfigModule.forRoot(),
    forwardRef(() => PlantsModule),
  ],
  controllers: [ChatbotController],
  providers: [ChatbotService, ChatGateway],
  exports: [ChatbotService],
})
export class ChatbotModule {}

