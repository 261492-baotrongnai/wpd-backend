import { InjectQueue } from '@nestjs/bullmq';
import { Controller, Get } from '@nestjs/common';
import { Queue } from 'bullmq';
import { QueueEventsRegistryService } from 'src/queue-events/queue-events.service';
import { TasksService } from './tasks.service';

@Controller('test-task')
export class TasksController {
  constructor(
    @InjectQueue('task') private readonly taskQueue: Queue,
    private readonly queueEventsRegistryService: QueueEventsRegistryService,
    private readonly tasksService: TasksService,
  ) {}

  // @Get('streaks-alert')
  // async handleStreaksAlert() {
  //   await this.tasksService.handleStreaksAlertCron();
  //   return { message: 'Streaks alert job triggered' };
  // }

  // reset streaks for users who have broken their streaks
  // @Get('streaks-reset')
  // async handleStreaksReset() {
  //   await this.tasksService.handleStereaksResetCron();
  //   return { message: 'Streaks reset job triggered' };
  // }
}
