import { OnWorkerEvent, Processor, WorkerHost } from '@nestjs/bullmq';
import { UsersService } from '../users.service';
import { Job } from 'bullmq';
import { Logger } from '@nestjs/common';

@Processor('user')
export class UserProcessor extends WorkerHost {
  private logger = new Logger(UserProcessor.name);
  constructor(private readonly usersService: UsersService) {
    super();
  }

  async process(job: Job<any>) {
    switch (job.name) {
      case 'update-streaks': {
        const { streaks, id } = job.data as {
          streaks: number;
          id: number;
        };

        if (!streaks || !id) {
          throw new Error(
            `Invalid data: missing fields, ${JSON.stringify({
              streaks,
              id,
            })}`,
          );
        }
        return await this.usersService.updateUserStreaks(streaks, id);
      }
      case 'update-total-days': {
        const { totalDays, id } = job.data as {
          totalDays: number;
          id: number;
        };
        if (!totalDays || !id) {
          throw new Error(
            `Invalid data: missing fields, ${JSON.stringify({
              totalDays,
              id,
            })}`,
          );
        }
        return await this.usersService.updateUserTotalDays(totalDays, id);
      }
      case 'add-points': {
        const { add_points, id } = job.data as {
          add_points: number;
          id: number;
        };
        if (!add_points || !id) {
          throw new Error(
            `Invalid data: missing fields, ${JSON.stringify({
              add_points,
              id,
            })}`,
          );
        }
        return await this.usersService.addUserPoints(add_points, id);
      }
      default:
        throw new Error(`Unknown job name: ${job.name}`);
    }
  }

  @OnWorkerEvent('progress')
  onJobProgress(job: Job) {
    this.logger.log(`Job progress: ${job.id}, job name: ${job.name}`);
  }

  @OnWorkerEvent('completed')
  onJobCompleted(job: Job) {
    this.logger.log(`Job completed: ${job.id}, job name: ${job.name}`);
  }

  @OnWorkerEvent('failed')
  onJobFailed(job: Job) {
    this.logger.error(`Job failed: ${job.id}, job name: ${job.name}`);
  }
}
