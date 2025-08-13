import { Module } from '@nestjs/common';
import { OrganizationsService } from './organizations.service';
import { OrganizationsController } from './organizations.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Organization } from './entities/organization.entity';
import { BullModule } from '@nestjs/bullmq';
import { OrganizationsProcessor } from './organizations.worker';
import { QueueEventsRegistryService } from 'src/queue-events/queue-events.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Organization]),
    BullModule.registerQueue({ name: 'organization' }),
  ],
  controllers: [OrganizationsController],
  providers: [
    OrganizationsService,
    OrganizationsProcessor,
    QueueEventsRegistryService,
  ],
})
export class OrganizationsModule {}
