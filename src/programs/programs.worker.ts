import { OnWorkerEvent, Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { ProgramsJobService } from './programs.job';
import { CreateProgramDto } from './dto/create.dto';

@Processor('program', {
  concurrency: 10,
})
export class ProgramProcessor extends WorkerHost {
  private logger = new Logger(ProgramProcessor.name);
  constructor(private readonly programJobService: ProgramsJobService) {
    super();
  }

  async process(job: Job) {
    this.logger.debug(`hello processor`);
    if (job.name === 'create-program') {
      this.logger.debug(
        `Processing create-program job with data: ${JSON.stringify(job.data)}`,
      );
      const { id, body } = job.data as { id: number; body: CreateProgramDto };
      return await this.programJobService.handleCreateProgramJob(id, body);
    } else if (job.name === 'get-program-info') {
      return await this.programJobService.handleGetProgramInfoJob(
        (job.data as { id: number }).id,
      );
    } else if (job.name === 'find-program-by-code') {
      return await this.programJobService.handleFindProgramByCodeJob(
        (job.data as { code: string }).code,
      );
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
