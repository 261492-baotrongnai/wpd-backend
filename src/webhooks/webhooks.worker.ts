import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';

@Processor('webhook')
export class WebhooksProcessor extends WorkerHost {
  private logger = new Logger(WebhooksProcessor.name);
  async process(job: Job) {
    // Process the job here
    this.logger.log('Processing webhook job:', job.id, 'with data:', job.data);

    // Example: Simulate processing time
    await new Promise((resolve) => setTimeout(resolve, 1000));

    this.logger.log('Webhook job processed successfully:', job.id);
  }
}
