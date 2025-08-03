import { Module } from '@nestjs/common';
import { TasksService } from './tasks.service';
import { BullModule } from '@nestjs/bullmq';
import { TasksProcessor } from './tasks.worker';

@Module({
  imports: [
    BullModule.registerQueue({
      name: 'follower',
    }),
    BullModule.registerQueue({
      name: 'meal',
    }),
    BullModule.registerQueue({
      name: 'task',
    }),
    BullModule.registerQueue({
      name: 'user-state',
    }),
  ],
  providers: [TasksService, TasksProcessor],
})
export class TasksModule {}
