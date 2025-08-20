import { Processor, WorkerHost } from '@nestjs/bullmq';
import { FoodsService } from './foods.service';
import { Job } from 'bullmq';
import { Logger } from '@nestjs/common';
import { EntityManager } from 'typeorm';
import { Admin } from 'src/admin/entities/admin.entity';

@Processor('food')
export class FoodsProcessor extends WorkerHost {
  private readonly logger = new Logger(FoodsProcessor.name);
  constructor(
    private readonly foodsService: FoodsService,
    private readonly entityManager: EntityManager,
  ) {
    super();
  }

  async process(job: Job) {
    switch (job.name) {
      case 'get-waiting-confirmation': {
        const data: { userId: number } = job.data as { userId: number };
        const id = data.userId;
        this.logger.log(`Processing job ${job.name} for admin ID: ${id}`);
        return await this.foodsService.getWaitingConfirmationFoods(id);
      }
      case 'check-editor-status': {
        const data: { userId: number } = job.data as { userId: number };
        const id = data.userId;
        this.logger.log(`Checking editor status for admin ID: ${id}`);
        const admin = await this.entityManager.findOne(Admin, {
          where: { id },
        });
        if (!admin || !admin.isEditor) {
          this.logger.error(
            `Admin with ID ${id} not found or is not an editor`,
          );
          throw new Error(`Admin with ID ${id} not found or is not an editor`);
        }
        return { isEditor: admin.isEditor };
      }
      default:
        throw new Error(`Unknown job type: ${job.name}`);
    }
  }
}
