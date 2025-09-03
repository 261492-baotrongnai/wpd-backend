import { OnWorkerEvent, Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { FollowersJobService } from './followers.job';

@Processor('follower', {
  concurrency: 30,
})
export class FollowerProcessor extends WorkerHost {
  private logger = new Logger(FollowerProcessor.name);
  constructor(private readonly followersJobService: FollowersJobService) {
    super();
  }

  async process(job: Job) {
    if (job.name === 'create-follower') {
      this.logger.debug(
        `Processing create-follower job with data: ${JSON.stringify(job.data)}`,
      );
      const { userId } = job.data as { userId: string };
      return await this.followersJobService.handleCreateFollowerJob(userId);
    } else if (job.name === 'get-user-id') {
      return await this.followersJobService.handleGetUserIdJob();
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
  onActive(job: Job) {
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
