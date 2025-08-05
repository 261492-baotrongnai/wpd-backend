import { Module } from '@nestjs/common';
import { ProgramsService } from './programs.service';
import { ProgramsController } from './programs.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Program } from './entities/programs.entity';
import { BullModule } from '@nestjs/bullmq';
import { JwtService } from '@nestjs/jwt';
import { ProgramsJobService } from './programs.job';
import { ProgramProcessor } from './programs.worker';
import { Admin } from 'src/admin/entities/admin.entity';
import { TokenService } from 'src/auth/token.service';
import { QueueEventsRegistryService } from 'src/queue-events/queue-events.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Program]),
    BullModule.registerQueue({
      name: 'program',
    }),
    Admin,
  ],
  controllers: [ProgramsController],
  providers: [
    ProgramsService,
    JwtService,
    ProgramsJobService,
    ProgramProcessor,
    TokenService,
    QueueEventsRegistryService,
  ],
  exports: [ProgramsService, ProgramsJobService, TypeOrmModule],
})
export class ProgramsModule {}
