import { OnWorkerEvent, Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { OrganizationsService } from './organizations.service';
import { CreateOrganizationDto } from './dto/create-organization.dto';

@Processor('organization')
export class OrganizationsProcessor extends WorkerHost {
  private logger = new Logger(OrganizationsProcessor.name);
  constructor(private readonly organizationsService: OrganizationsService) {
    super();
  }

  async process(job: Job): Promise<any> {
    try {
      switch (job.name) {
        case 'create-organization': {
          const { adminId, createOrganizationDto } = job.data as {
            adminId: number;
            createOrganizationDto: CreateOrganizationDto;
          };
          const createdOrganization = await this.organizationsService.create(
            createOrganizationDto,
          );
          this.logger.log(
            `Organization created with ID: ${createdOrganization.id}`,
          );
          await this.organizationsService.addAdminToOrganization(
            createdOrganization.id,
            adminId,
          );
          this.logger.log(
            `admin with ID: ${adminId} added to organization ID: ${createdOrganization.id}`,
          );
          return createdOrganization;
        }
        case 'find-all-organizations':
          return await this.organizationsService.findAll();
        case 'find-organization': {
          const data = job.data as { id: number };
          const organizationId = data.id;
          return await this.organizationsService.findOne(organizationId);
        }
        case 'delete-organization': {
          const deleteData = job.data as { id: number };
          const organizationId = deleteData.id;
          return await this.organizationsService.remove(organizationId);
        }
        case 'find-programs-of-organization': {
          const orgData = job.data as { organizationId: number };
          const organizationId = orgData.organizationId;
          return await this.organizationsService.findProgramsOfOrganization(
            organizationId,
          );
        }
        case 'add-admin-to-organization': {
          const adminData = job.data as {
            organizationId: number;
            adminId: number;
          };
          const { organizationId, adminId } = adminData;
          return await this.organizationsService.addAdminToOrganization(
            organizationId,
            adminId,
          );
        }
        case 'get-organization-table': {
          const { adminId } = job.data as { adminId: number };
          return await this.organizationsService.getOrganizationTable(adminId);
        }
        default:
          this.logger.warn(`Unknown job type: ${job.name}`);
      }
    } catch (error) {
      const errorMessage =
        typeof error === 'object' && error !== null && 'message' in error
          ? (error as { message: string }).message
          : String(error);
      this.logger.error(`Error processing job ${job.id}: ${errorMessage}`);
      throw error;
    }
  }

  @OnWorkerEvent('progress')
  onProgress(job: Job, progress: number) {
    this.logger.log(`Job ${job.id} is ${progress}% complete`);
  }

  @OnWorkerEvent('active')
  onActive(job: Job) {
    this.logger.log(`Job ${job.id} is now active`);
  }
  @OnWorkerEvent('completed')
  onCompleted(job: Job, result: any) {
    this.logger.log(`Job ${job.id} completed successfully`);
    if (result && typeof result === 'object') {
      this.logger.debug(`Result: ${JSON.stringify(result, null, 2)}`);
    }
  }

  @OnWorkerEvent('failed')
  onFailed(job: Job, error: any) {
    this.logger.error(`Job ${job.id} failed`);
    if (error && typeof error === 'object') {
      this.logger.error(`Error: ${JSON.stringify(error, null, 2)}`);
    }
  }
}
