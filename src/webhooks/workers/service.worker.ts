import { OnWorkerEvent, Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';

@Processor('webhook-service', { limiter: { max: 1, duration: 1000 } })
export class ServiceProcessor extends WorkerHost {
  private logger = new Logger(ServiceProcessor.name);

  async process(job: Job) {
    this.logger.log(job.data);
    const totalSteps = 5;

    for (let i = 1; i <= totalSteps; i++) {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      const progress = Math.floor((i / totalSteps) * 100);
      await job.updateProgress(progress);
    }
  }

  // @OnWorkerEvent('progress')
  // onProgress(job: Job) {
  //   // const progressStr =
  //   //   typeof job.progress === 'object'
  //   //     ? JSON.stringify(job.progress)
  //   //     : String(job.progress);
  //   // this.logger.log(`Job ${job.id} progress: ${progressStr}%`);
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
