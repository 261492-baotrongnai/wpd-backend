import { Module } from '@nestjs/common';
import { WebhooksController } from './webhooks.controller';
import { WebhooksService } from './webhooks.service';
import { RecordCaseHandler } from './record-case';
import { ChoiceLogsProcessor } from './workers/userChoiceLog.worker';
import { BullModule } from '@nestjs/bullmq';
import { UsersModule } from 'src/users/users.module';
import { UserStatesModule } from 'src/user-states/user-states.module';
import { ImagesModule } from 'src/images/images.module';
import { ExternalApiService } from 'src/external-api/external-api.service';
import { FoodGradesModule } from 'src/food-grades/food-grades.module';
import { MealsModule } from 'src/meals/meals.module';
import { FoodsModule } from 'src/foods/foods.module';
import { WebhookProcessor } from './workers/webhooks.worker';
import { TasksService } from 'src/tasks/tasks.service';

@Module({
  imports: [
    BullModule.registerQueue({
      name: 'webhook',
    }),

    BullModule.registerQueue({
      name: 'user-choice-logs',
    }),
    BullModule.registerQueue({
      name: 'follower',
    }),
    BullModule.registerQueue({
      name: 'meal',
    }),
    UsersModule,
    UserStatesModule,
    ImagesModule,
    FoodGradesModule,
    MealsModule,
    FoodsModule,
  ],
  controllers: [WebhooksController],
  providers: [
    WebhooksService,
    RecordCaseHandler,
    ChoiceLogsProcessor,
    ExternalApiService,
    WebhookProcessor,
    TasksService,
  ],
  exports: [],
})
export class WebhookModule {}
