import { OnWorkerEvent, Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import * as line from '@line/bot-sdk';
import { WebhooksService } from 'src/webhooks/webhooks.service';

@Processor('webhook')
export class WebhookProcessor extends WorkerHost {
  private logger = new Logger(WebhookProcessor.name);

  constructor(private readonly webhookService: WebhooksService) {
    super();
  }

  async process(job: Job) {
    if (job.name === 'process-event') {
      return await this.webhookService.processEvents(
        job.data as line.WebhookEvent[],
      );
    }
  }

  @OnWorkerEvent('progress')
  onProgress(job: Job) {
    const progressStr =
      typeof job.progress === 'object'
        ? JSON.stringify(job.progress)
        : String(job.progress);
    this.logger.log(
      `Job name: ${job.name} id: ${job.id} progress: ${progressStr}%`,
    );
  }

  @OnWorkerEvent('active')
  onActive(job: Job) {
    this.logger.log(`Job name: ${job.name} id: ${job.id} is now active`);
  }

  @OnWorkerEvent('completed')
  onCompleted(job: Job) {
    this.logger.log(
      `Job name: ${job.name} id: ${job.id} completed successfully`,
    );
  }

  @OnWorkerEvent('failed')
  onFailed(job: Job, error: Error) {
    this.logger.error(
      `Job name: ${job.name} id: ${job.id} failed with error: ${error.message}`,
    );
    this.logger.error(`Attempts: ${job.attemptsMade}`);
  }
}
