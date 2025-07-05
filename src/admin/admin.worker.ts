import { OnWorkerEvent, Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { AdminJobService } from './admin-job.service';
import { CreateAdminLineDto } from './dto/create-admin.dto';

@Processor('admin', {
  concurrency: 10,
})
export class AdminProcessor extends WorkerHost {
  private logger = new Logger(AdminProcessor.name);
  constructor(private readonly adminJobService: AdminJobService) {
    super();
  }

  async process(job: Job<CreateAdminLineDto>) {
    if (job.name === 'create-admin-line') {
      return await this.adminJobService.handleCreateAdminLineJob(job.data);
    }
  }

  @OnWorkerEvent('progress')
  onProgress(job: Job) {
    const progressStr =
      typeof job.progress === 'object'
        ? JSON.stringify(job.progress)
        : String(job.progress);
    this.logger.log(`Job ${job.id} progress: ${progressStr}%`);
  }

  @OnWorkerEvent('active')
  onAdded(job: Job) {
    this.logger.log(`Got job ${job.id} of type ${job.name}`);
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
