import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { HomeSettingsController } from "./home-settings.controller";
import { HomeSettingsService } from "./home-settings.service";
import { HelpersModule } from "../../helpers/helpers.module";
import {
  HomeSettings,
  HomeSettingsSchema,
} from "./schemas/home-settings.schema";

@Module({
  imports: [
    HelpersModule,
    MongooseModule.forFeature([
      { name: HomeSettings.name, schema: HomeSettingsSchema },
    ]),
  ],
  controllers: [HomeSettingsController],
  providers: [HomeSettingsService],
  exports: [HomeSettingsService],
})
export class HomeSettingsModule {}
