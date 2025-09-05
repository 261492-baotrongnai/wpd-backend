import { Module } from '@nestjs/common';
import { UserStatesService } from './user-states.service';
import { UserStatesController } from './user-states.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserState } from './entities/user-state.entity';
import { BullModule } from '@nestjs/bullmq';
import { UserStateProcessor } from './workers/user-state.worker';
import { QueueEventsRegistryService } from 'src/queue-events/queue-events.service';
import { ImagesService } from 'src/images/images.service';
import { ImagesModule } from 'src/images/images.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([UserState]),
    BullModule.registerQueue({
      name: 'user-state',
    }),
    ImagesModule,
  ],
  controllers: [UserStatesController],
  providers: [
    UserStatesService,
    UserStateProcessor,
    QueueEventsRegistryService,
    ImagesService,
  ],
  exports: [UserStatesService],
})
export class UserStatesModule {}
