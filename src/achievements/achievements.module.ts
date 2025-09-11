import { Module } from '@nestjs/common';
import { AchievementsService } from './achievements.service';
import { AchievementsController } from './achievements.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Achievement } from './entities/achievement.entity';
import { User } from 'src/users/entities/user.entity';
import { BullModule } from '@nestjs/bullmq';
import { QueueEventsRegistryService } from 'src/queue-events/queue-events.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Achievement, User]),
    BullModule.registerQueue(
      {
        name: 'meal',
      },
      {
        name: 'user',
      },
    ),
  ],
  controllers: [AchievementsController],
  providers: [AchievementsService, QueueEventsRegistryService],
  exports: [AchievementsService],
})
export class AchievementsModule {}
