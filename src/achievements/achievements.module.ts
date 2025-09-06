import { Module } from '@nestjs/common';
import { AchievementsService } from './achievements.service';
import { AchievementsController } from './achievements.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Achievement } from './entities/achievement.entity';
import { BullModule } from '@nestjs/bullmq';
import { AchievementsProcessor } from './workers/achievements.worker';
import { QueueEventsRegistryService } from 'src/queue-events/queue-events.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Achievement]),
    BullModule.registerQueue(
      {
        name: 'achievement',
      },
      {
        name: 'meal',
      },
      {
        name: 'user',
      },
    ),
  ],
  controllers: [AchievementsController],
  providers: [
    AchievementsService,
    AchievementsProcessor,
    QueueEventsRegistryService,
  ],
})
export class AchievementsModule {}
