import { OnWorkerEvent, Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';

@Processor('user-choice-logs', {
  concurrency: 100,
})
export class ChoiceLogsProcessor extends WorkerHost {
  private readonly logger = new Logger(ChoiceLogsProcessor.name);

  async process(job: Job<any>) {
    this.logger.debug(
      `Processing user choice log: ${JSON.stringify(job.data)}`,
    );
    return true;
  }
}
