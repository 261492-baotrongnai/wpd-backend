import { OnWorkerEvent, Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';

@Processor('webhook', { limiter: { max: 1, duration: 1000 } })
export class WebhooksProcessor extends WorkerHost {
  private logger = new Logger(WebhooksProcessor.name);

  process(job: Job): any {
    this.logger.debug(`Processing job ${job.id} of type ${job.name}`);
    // Here you would handle the job based on its name or data
    // For example, if the job is to process a webhook:
    if (job.name === 'process-webhook') {
      // Process the webhook data
      const webhookData = job.data as Record<string, unknown>;
      this.logger.debug(`Webhook data: ${JSON.stringify(webhookData)}`);
      // Add your processing logic here
      return { status: 'success', data: webhookData };
    }
    // Handle other job types as needed
    return { status: 'unknown job type' };
  }

  // @OnWorkerEvent('progress')
  // onProgress(job: Job) {
  //   const progressStr =
  //     typeof job.progress === 'object'
  //       ? JSON.stringify(job.progress)
  //       : String(job.progress);
  // }

  @OnWorkerEvent('active')
  onAdded(job: Job) {
    this.logger.log(`Got job ${job.id} `);
  }

  @OnWorkerEvent('completed')
  onCompleted(job: Job) {
    this.logger.log(`Job ${job.id} completed successfully`);
  }
  @OnWorkerEvent('failed')
  onFailed(job: Job, error: Error) {
    this.logger.error(`Job ${job.id} failed with error: ${error.message}`);
    this.logger.error(`Attempts: ${job.attemptsMade}`);
  }
}
