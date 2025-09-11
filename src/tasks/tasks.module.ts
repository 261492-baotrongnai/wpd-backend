import { Module } from '@nestjs/common';
import { TasksService } from './tasks.service';
import { BullModule } from '@nestjs/bullmq';
import { TasksProcessor } from './tasks.worker';
import { QueueEventsRegistryService } from 'src/queue-events/queue-events.service';
import { TasksController } from './tasks.controller';

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
    BullModule.registerQueue({
      name: 'user',
    }),
  ],
  controllers: [TasksController],
  providers: [TasksService, TasksProcessor, QueueEventsRegistryService],
})
export class TasksModule {}
