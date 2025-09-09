import { OnWorkerEvent, Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';

@Processor('canEatCheck-user-decide', {
  concurrency: 100,
})
export class canEatCheckProcessor extends WorkerHost {
  private readonly logger = new Logger(canEatCheckProcessor.name);

  async process(job: Job<any>) {
    this.logger.debug(
      `Processing user choice log: ${JSON.stringify(job.data)}`,
    );
    return true;
  }
}
