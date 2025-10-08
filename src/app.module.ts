import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { DatabaseModule } from './database/database.module';
import { ImagesModule } from './images/images.module';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { UserStatesModule } from './user-states/user-states.module';
import { ExternalApiModule } from './external-api/external-api.module';
import { MealsModule } from './meals/meals.module';
import { FoodGradesModule } from './food-grades/food-grades.module';
import { FoodsModule } from './foods/foods.module';
import { BullModule } from '@nestjs/bullmq';
import { AdminModule } from './admin/admin.module';
import { ProgramsModule } from './programs/programs.module';
import { ChoiceLogsModule } from './choice-logs/logs.module';
import { userDecideQueueModule } from './canEatCheck-logs/logs.module';
import { ScheduleModule } from '@nestjs/schedule';
import { FollowersModule } from './followers/followers.module';
import { WebhookModule } from './webhooks/webhook.module';
import { OrganizationsModule } from './organizations/organizations.module';
import { TasksModule } from './tasks/tasks.module';
import { AchievementsModule } from './achievements/achievements.module';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { StoreItemsModule } from './store_items/store_items.module';

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
    ChoiceLogsModule,
    userDecideQueueModule,
    BullModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        connection: {
          host: configService.get<string>('REDIS_HOST') || '127.0.0.1',
          port: configService.get<number>('REDIS_PORT') || 6379,
          password: configService.get<string>('REDIS_PASSWORD'),

          // Connection timeout settings
          connectTimeout: 30000, // 30 seconds (default is 10s)

          // Retry strategy for failed connections
          retryStrategy: (times: number) => {
            if (times > 10) {
              // Stop retrying after 10 attempts
              console.error('Redis connection failed after 10 retries');
              return null;
            }
            // Exponential backoff: 200ms, 400ms, 800ms, etc., max 5 seconds
            const delay = Math.min(times * 200, 5000);
            console.log(`Redis retry attempt ${times}, waiting ${delay}ms...`);
            return delay;
          },

          // Keep connection alive
          keepAlive: 30000, // 30 seconds

          // Enable offline queue to buffer commands while connecting
          enableOfflineQueue: true,

          // Maximum number of commands to queue while connecting
          // BullMQ requires this to be null so it can manage retries itself
          maxRetriesPerRequest: null,

          // Reconnect on error
          lazyConnect: false,
          enableReadyCheck: true,

          // Note: Don't set commandTimeout here; BullMQ uses blocking commands that can exceed short timeouts.
        },
        defaultJobOptions: {
          removeOnComplete: 1000,
          removeOnFail: 3000,
          attempts: 3,
          backoff: {
            type: 'exponential',
            delay: 2000,
          },
        },
        ttl: 360000 * 24 * 15, // 15 days
      }),
    }),

    BullModule.registerQueue({
      name: 'follower',
    }),
    BullModule.registerQueue({
      name: 'meal',
    }),
    AdminModule,
    ProgramsModule,
    ScheduleModule.forRoot(),
    TasksModule,
    FollowersModule,
    WebhookModule,
    OrganizationsModule,
    AchievementsModule,
    EventEmitterModule.forRoot(),
    StoreItemsModule,
  ],
})
export class AppModule {}
