import { Injectable } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';

@Injectable()
export class ChoiceLogsService {
  constructor(@InjectQueue('user-choice-logs') private logsQueue: Queue) {}

  /**
   * Get all completed logs (processed jobs) from BullMQ
   */
  async getCompletedLogs(limit = 100) {
    // Get completed jobs from index 0 to limit-1
    const jobs = await this.logsQueue.getJobs(['completed'], 0, limit - 1);

    return jobs.map((job) => ({
      id: job.id,
      data: job.data,
      finishedOn: job.finishedOn,
    }));
  }

  async getAllCompletedLogs() {
    const jobs = await this.logsQueue.getJobs(['completed']);

    return jobs.map((job) => ({
        jobId: job.id,
        data: job.data, 
        finishedOn: job.finishedOn,
    }));
  }

}
