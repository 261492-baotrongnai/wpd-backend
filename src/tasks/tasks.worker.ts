import { OnWorkerEvent, Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { TasksService } from 'src/tasks/tasks.service';
import { Job } from 'bullmq';

@Processor('task', {
  concurrency: 10,
})
export class TasksProcessor extends WorkerHost {
  private logger = new Logger(TasksProcessor.name);

  constructor(private readonly tasksService: TasksService) {
    super();
  }

  async process(job: Job) {
    if (job.name === 'task-breakfast') {
      this.logger.debug(`Processing breakfast job id : ${job.id}`);
      return await this.tasksService.handleBreakfastJob();
    } else if (job.name === 'task-lunch') {
      this.logger.debug(`Processing lunch job id : ${job.id}`);
      return await this.tasksService.handleLunchJob();
    } else if (job.name === 'task-dinner') {
      this.logger.debug(`Processing dinner job id : ${job.id}`);
      return await this.tasksService.handleDinnerJob();
    }
  }

  @OnWorkerEvent('progress')
  onProgress(job: Job) {
    this.logger.debug(`Job name: ${job.name} id: ${job.id} is in progress`);
  }

  @OnWorkerEvent('active')
  onActive(job: Job) {
    this.logger.debug(`Job name: ${job.name} id: ${job.id} is active`);
  }
  @OnWorkerEvent('completed')
  onCompleted(job: Job) {
    this.logger.debug(
      `Job name: ${job.name} id: ${job.id} completed successfully`,
    );
  }
  @OnWorkerEvent('failed')
  onFailed(job: Job, error: Error) {
    this.logger.error(
      `Job name: ${job.name} id: ${job.id} failed with error: ${error.message}`,
    );
    this.logger.error(`Attempts: ${job.attemptsMade}`);
  }
}
