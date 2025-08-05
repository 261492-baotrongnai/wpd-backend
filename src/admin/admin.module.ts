import { Module } from '@nestjs/common';
import { AdminService } from './admin.service';
import { AdminController } from './admin.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Admin } from './entities/admin.entity';
import { BullModule } from '@nestjs/bullmq';
import { AdminProcessor } from './admin.worker';
import { AdminJobService } from './admin-job.service';
import { JwtService } from '@nestjs/jwt';
import { QueueEventsRegistryService } from 'src/queue-events/queue-events.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Admin]),
    BullModule.registerQueue({
      name: 'admin',
    }),
  ],
  controllers: [AdminController],
  providers: [
    AdminService,
    AdminProcessor,
    AdminJobService,
    JwtService,
    QueueEventsRegistryService,
  ],
  exports: [AdminService, AdminJobService, TypeOrmModule],
})
export class AdminModule {}
