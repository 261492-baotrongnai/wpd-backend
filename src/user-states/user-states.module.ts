import { Module } from '@nestjs/common';
import { UserStatesService } from './user-states.service';
import { UserStatesController } from './user-states.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserState } from './entities/user-state.entity';
import { BullModule } from '@nestjs/bullmq';
import { UserStateProcessor } from './workers/user-state.worker';
import { QueueEventsRegistryService } from 'src/queue-events/queue-events.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([UserState]),
    BullModule.registerQueue({
      name: 'user-state',
    }),
  ],
  controllers: [UserStatesController],
  providers: [
    UserStatesService,
    UserStateProcessor,
    QueueEventsRegistryService,
  ],
  exports: [UserStatesService],
})
export class UserStatesModule {}
