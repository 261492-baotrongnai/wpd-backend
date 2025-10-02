import { OnWorkerEvent, Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { AdminJobService } from './admin-job.service';
import { AdminService } from './admin.service';

@Processor('admin', {
  concurrency: 500,
})
export class AdminProcessor extends WorkerHost {
  private logger = new Logger(AdminProcessor.name);
  constructor(
    private readonly adminJobService: AdminJobService,
    private readonly adminService: AdminService,
  ) {
    super();
  }

  async process(job: Job) {
    switch (job.name) {
      case 'create-admin-line':
        if ('idToken' in job.data) {
          return await this.adminJobService.handleCreateAdminLineJob(
            job.data as { idToken: string; username?: string },
          );
        }
        break;
      case 'get-admin-info':
        return await this.adminJobService.handleGetAdminInfoJob(
          job.data as { internalId: string; id: number },
        );
      case 'find-organization-admins':
        return await this.adminService.findOrganizationsOfAdmin(
          (job.data as { adminId: number }).adminId,
        );
      default:
        // Optionally handle unknown job types
        this.logger.warn(`Unknown job name: ${job.name}`);
        break;
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
