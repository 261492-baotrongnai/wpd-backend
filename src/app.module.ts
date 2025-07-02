import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { DatabaseModule } from './database/database.module';
import { ImagesModule } from './images/images.module';
import { UsersModule } from './users/users.module';
import { WebhooksController } from './webhooks/webhooks.controller';
import { WebhooksService } from './webhooks/webhooks.service';
import { AuthModule } from './auth/auth.module';
import { UserStatesModule } from './user-states/user-states.module';
import { RecordCaseHandler } from './webhooks/record-case';
import { ExternalApiModule } from './external-api/external-api.module';
import { MealsModule } from './meals/meals.module';
import { FoodGradesModule } from './food-grades/food-grades.module';
import { FoodsModule } from './foods/foods.module';
import { BullModule } from '@nestjs/bullmq';
import { WebhooksProcessor } from './webhooks/webhooks.worker';
@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
      expandVariables: true,
    }),
    DatabaseModule,
    ImagesModule,
    UsersModule,
    AuthModule,
    UserStatesModule,
    ExternalApiModule,
    MealsModule,
    FoodGradesModule,
    FoodsModule,
    BullModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        connection: {
          host: configService.get<string>('REDIS_HOST') || '127.0.0.1',
          port: configService.get<number>('REDIS_PORT') || 6379,
          password: configService.get<string>('REDIS_PASSWORD'),
        },
        defaultJobOptions: {
          removeOnComplete: 1000,
          removeOnFail: 3000,
          attempts: 3,
        },
      }),
    }),
    BullModule.registerQueue({
      name: 'webhook',
    }),
  ],
  controllers: [WebhooksController],
  providers: [WebhooksService, RecordCaseHandler, WebhooksProcessor],
})
export class AppModule {}
