import { OnWorkerEvent, Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { TasksService } from 'src/tasks/tasks.service';
import { Job } from 'bullmq';

@Processor('task', {
  concurrency: 1, // Reduce concurrency to avoid resource conflicts
})
export class TasksProcessor extends WorkerHost {
  private logger = new Logger(TasksProcessor.name);

  constructor(private readonly tasksService: TasksService) {
    super();
  }

  async process(job: Job): Promise<any> {
    const startTime = Date.now();
    this.logger.debug(`Starting job ${job.name} (ID: ${job.id})`);

    try {
      let result: any;

      switch (job.name) {
        case 'task-breakfast':
          this.logger.debug(`Processing breakfast job id: ${job.id}`);
          result = await this.tasksService.handleBreakfastJob();
          break;

        case 'task-lunch':
          this.logger.debug(`Processing lunch job id: ${job.id}`);
          result = await this.tasksService.handleLunchJob();
          break;

        case 'task-dinner':
          this.logger.debug(`Processing dinner job id: ${job.id}`);
          result = await this.tasksService.handleDinnerJob();
          break;
        case 'task-streaks-alert':
          this.logger.debug(`Processing streaks alert job id: ${job.id}`);
          result = await this.tasksService.handleStreaksAlertJob();
          break;
        case 'task-streaks-reset':
          this.logger.debug(`Processing streaks reset job id: ${job.id}`);
          result = await this.tasksService.handleStreaksResetJob();
          break;
        default:
          throw new Error(`Unknown job type: ${job.name}`);
      }

      const duration = Date.now() - startTime;
      this.logger.debug(
        `Job ${job.name} (ID: ${job.id}) completed in ${duration}ms`,
      );

      return result;
    } catch (error) {
      const duration = Date.now() - startTime;
      this.logger.error(
        `Job ${job.name} (ID: ${job.id}) failed after ${duration}ms:`,
        error,
      );
      throw error;
    }
  }

  @OnWorkerEvent('progress')
  onProgress(job: Job, progress: number | object) {
    this.logger.debug(
      `Job ${job.name} (ID: ${job.id}) progress: ${JSON.stringify(progress)}`,
    );
  }

  @OnWorkerEvent('active')
  onActive(job: Job) {
    this.logger.debug(`Job ${job.name} (ID: ${job.id}) is now active`);
  }

  @OnWorkerEvent('completed')
  onCompleted(job: Job, result: any) {
    this.logger.debug(`Job ${job.name} (ID: ${job.id}) completed successfully`);
    if (result && typeof result === 'object') {
      this.logger.debug(`Result: ${JSON.stringify(result, null, 2)}`);
    }
  }

  @OnWorkerEvent('failed')
  onFailed(job: Job, error: Error) {
    this.logger.error(
      `Job ${job.name} (ID: ${job.id}) failed with error: ${error.message}`,
    );
    this.logger.error(
      `Attempts made: ${job.attemptsMade}/${job.opts.attempts || 1}`,
    );
    this.logger.error(`Error stack: ${error.stack}`);

    // Log job data for debugging
    if (job.data) {
      this.logger.debug(`Job data: ${JSON.stringify(job.data)}`);
    }
  }

  @OnWorkerEvent('stalled')
  onStalled(jobId: string) {
    this.logger.warn(`Job ${jobId} has stalled and will be retried`);
  }

  @OnWorkerEvent('error')
  onError(error: Error) {
    this.logger.error(`Worker error: ${error.message}`);
    this.logger.error(`Error stack: ${error.stack}`);
  }
}
