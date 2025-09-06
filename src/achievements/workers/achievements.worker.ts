import { OnWorkerEvent, Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { AchievementsService } from '../achievements.service';

@Processor('achievement', { concurrency: 100 })
export class AchievementsProcessor extends WorkerHost {
  private readonly logger = new Logger(AchievementsProcessor.name);
  constructor(private readonly achievementsService: AchievementsService) {
    super();
  }

  async process(job: Job) {
    switch (job.name) {
      case 'update-achievement': {
        const { userId } = job.data as { userId: number };
        await this.achievementsService.updateStreaks(userId);
        await this.achievementsService.updateTotalDays(userId);
        return;
      }
      default:
        this.logger.warn(`Unhandled job ${job.name}`);
        return;
    }
  }

  @OnWorkerEvent('progress')
  onProgress(job: Job, progress: number) {
    this.logger.log(`Job ${job.id} is ${progress}% complete`);
  }

  @OnWorkerEvent('completed')
  onCompleted(job: Job) {
    this.logger.log(`Job ${job.id} has completed`);
  }

  @OnWorkerEvent('failed')
  onFailed(job: Job, err: Error) {
    this.logger.error(`Job ${job.id} has failed: ${err.message}`);
  }
}
