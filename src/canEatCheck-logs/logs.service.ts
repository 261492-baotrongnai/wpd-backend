import { Injectable } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';

@Injectable()
export class userDecideQueueService {
  constructor(@InjectQueue('canEatCheck-user-decide') private logsQueue: Queue) {}

  /**
   * Get all completed logs (processed jobs) from BullMQ
   */

  async getAllCompletedLogs() {
    const jobs = await this.logsQueue.getJobs(['completed']);

    return jobs.map((job) => ({
        jobId: job.id,
        data: job.data, 
        finishedOn: job.finishedOn,
    }));
  }

}
