import { Controller } from '@nestjs/common';
import { AchievementsService } from './achievements.service';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';

@Controller('achievements')
export class AchievementsController {
  constructor(
    private readonly achievementsService: AchievementsService,
    @InjectQueue('achievement') private readonly achievementQueue: Queue,
  ) {}
}
