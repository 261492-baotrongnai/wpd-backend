import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { TasksService } from 'src/tasks/tasks.service';
import { Job } from 'bullmq';
import * as line from '@line/bot-sdk';
import { WebhooksService } from 'src/webhooks/webhooks.service';

@Processor('webhook', {
  concurrency: 10,
})
export class WebhookProcessor extends WorkerHost {
  private logger = new Logger(WebhookProcessor.name);

  constructor(
    private readonly tasksService: TasksService,
    private readonly webhookService: WebhooksService,
  ) {
    super();
  }

  async process(job: Job) {
    if (job.name === 'task-breakfast') {
      this.logger.debug(
        `Processing breakfast job with data: ${JSON.stringify(job.data)}`,
      );
      return await this.tasksService.handleBreakfastJob();
    } else if (job.name === 'task-lunch') {
      this.logger.debug(
        `Processing lunch job with data: ${JSON.stringify(job.data)}`,
      );
      return await this.tasksService.handleLunchJob();
    } else if (job.name === 'task-dinner') {
      this.logger.debug(
        `Processing dinner job with data: ${JSON.stringify(job.data)}`,
      );
      return await this.tasksService.handleDinnerJob();
    } else if (job.name === 'process-event') {
      return await this.webhookService.processEvents(
        job.data as line.WebhookEvent[],
      );
    }
  }
}
