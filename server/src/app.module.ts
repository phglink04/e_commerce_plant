import { Module } from "@nestjs/common";
import { APP_GUARD } from "@nestjs/core";
import { ConfigModule } from "@nestjs/config";
import { ConfigService } from "@nestjs/config";
import { MongooseModule } from "@nestjs/mongoose";
import { ThrottlerGuard, ThrottlerModule } from "@nestjs/throttler";
import { AuthModule } from "./auth/auth.module";
import { UsersModule } from "./module/users/users.module";
import { PlantsModule } from "./module/plants/plants.module";
import { OrdersModule } from "./module/orders/orders.module";
import { PaymentModule } from "./module/payment/payment.module";
import { HelpersModule } from "./helpers/helpers.module";
import { HomeSettingsModule } from "./module/home-settings/home-settings.module";
import { AddressModule } from "./module/address/address.module";
import { CartModule } from "./module/cart/cart.module";
import { DeliveryModule } from "./module/delivery/delivery.module";
import { CategoriesModule } from "./module/categories/categories.module";
import { DashboardModule } from "./module/dashboard/dashboard.module";
import { BlogsModule } from "./module/blogs/blogs.module";
import { DiscountsModule } from "./module/discounts/discounts.module";
import { ReviewsModule } from "./module/reviews/reviews.module";
import { ChatbotModule } from "./module/chatbot/chatbot.module";
import { envValidationSchema } from "./infrastructure/config/env.validation";

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validationSchema: envValidationSchema,
      validationOptions: {
        abortEarly: false,
        allowUnknown: true,
      },
    }),
    ThrottlerModule.forRoot([
      {
        ttl: 60_000,
        limit: 100,
      },
    ]),
    MongooseModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        uri: configService.getOrThrow<string>("MONGODB_URI"),
        maxPoolSize: configService.get<number>("MONGODB_MAX_POOL_SIZE", 50),
        minPoolSize: configService.get<number>("MONGODB_MIN_POOL_SIZE", 5),
        maxIdleTimeMS: configService.get<number>(
          "MONGODB_MAX_IDLE_TIME_MS",
          60000,
        ),
        connectTimeoutMS: configService.get<number>(
          "MONGODB_CONNECT_TIMEOUT_MS",
          10000,
        ),
        socketTimeoutMS: configService.get<number>(
          "MONGODB_SOCKET_TIMEOUT_MS",
          30000,
        ),
        serverSelectionTimeoutMS: configService.get<number>(
          "MONGODB_SERVER_SELECTION_TIMEOUT_MS",
          5000,
        ),
      }),
    }),
    AuthModule,
    UsersModule,
    PlantsModule,
    OrdersModule,
    PaymentModule,
    HelpersModule,
    HomeSettingsModule,
    AddressModule,
    CartModule,
    DeliveryModule,
    CategoriesModule,
    DashboardModule,
    BlogsModule,
    DiscountsModule,
    ReviewsModule,
    ChatbotModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
