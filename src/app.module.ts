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

import { ScheduleModule } from '@nestjs/schedule';
import { FollowersModule } from './followers/followers.module';
import { WebhookModule } from './webhooks/webhook.module';
import { OrganizationsModule } from './organizations/organizations.module';
import { TasksModule } from './tasks/tasks.module';
import { AchievementsModule } from './achievements/achievements.module';

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
  ],
})
export class AppModule {}
