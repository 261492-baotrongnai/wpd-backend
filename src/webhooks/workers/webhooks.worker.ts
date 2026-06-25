import { OnWorkerEvent, Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import * as line from '@line/bot-sdk';
import { WebhooksService } from 'src/webhooks/webhooks.service';

@Processor('webhook', { concurrency: 150 })
export class WebhookProcessor extends WorkerHost {
  private logger = new Logger(WebhookProcessor.name);

  constructor(private readonly webhookService: WebhooksService) {
    super();
  }

  private serializeError(error: unknown) {
    if (error instanceof Error) {
      return {
        name: error.name,
        message: error.message,
        stack: error.stack,
      };
    }

    return {
      name: 'UnknownError',
      message: String(error),
      stack: undefined,
    };
  }

  private toSafeString(value: unknown, maxLength = 2000): string {
    let serialized = '';
    try {
      serialized = JSON.stringify(value);
    } catch {
      serialized = String(value);
    }

    if (serialized.length <= maxLength) {
      return serialized;
    }

    return `${serialized.slice(0, maxLength)}...[truncated]`;
  }

  async process(job: Job) {
    if (job.name === 'process-event') {
      const events = job.data as line.WebhookEvent[];

      try {
        return await this.webhookService.processEvents(events);
      } catch (error) {
        const errorInfo = this.serializeError(error);
        const debugPayload = {
          scope: 'webhook-process-error',
          queue: 'webhook',
          jobId: job.id,
          jobName: job.name,
          attemptsMade: job.attemptsMade,
          configuredAttempts: job.opts.attempts || 1,
          eventCount: events.length,
          eventsSummary: events.map((event) => ({
            type: event.type,
            sourceType: event.source?.type,
            sourceUserId:
              event.source?.type === 'user' ? event.source.userId : undefined,
            messageType:
              event.type === 'message' ? event.message?.type : undefined,
            messageText:
              event.type === 'message' && event.message?.type === 'text'
                ? event.message.text
                : undefined,
            replyToken: 'replyToken' in event ? event.replyToken : undefined,
            timestamp: event.timestamp,
          })),
          failedReason: errorInfo.message,
          errorName: errorInfo.name,
          errorStack: errorInfo.stack,
          loggedAt: new Date().toISOString(),
        };

        const serializedPayload = this.toSafeString(debugPayload);
        await job.log(serializedPayload);
        this.logger.error(
          `Saved webhook debug payload to Redis logs for job ${job.id}`,
        );

        throw error;
      }
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
  async onFailed(job: Job, error: Error) {
    this.logger.error(
      `Job name: ${job.name} id: ${job.id} failed with error: ${error.message}`,
    );
    this.logger.error(`Attempts: ${job.attemptsMade}`);

    await job.log(
      this.toSafeString({
        scope: 'webhook-failed-event',
        queue: 'webhook',
        jobId: job.id,
        jobName: job.name,
        attemptsMade: job.attemptsMade,
        configuredAttempts: job.opts.attempts || 1,
        failedReason: error.message,
        errorName: error.name,
        errorStack: error.stack,
        loggedAt: new Date().toISOString(),
      }),
    );
  }
}
