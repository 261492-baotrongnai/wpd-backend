import { Module } from '@nestjs/common';
import { TasksService } from './tasks.service';
import { BullModule } from '@nestjs/bullmq';

@Module({
  imports: [
    BullModule.registerQueue({
      name: 'follower',
    }),
    BullModule.registerQueue({
      name: 'meal',
    }),
    BullModule.registerQueue({
      name: 'webhook',
    }),
  ],
  providers: [TasksService],
})
export class TasksModule {}
