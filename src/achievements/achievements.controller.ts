import { Controller, Get, Request, UseGuards } from '@nestjs/common';
import { AchievementsService } from './achievements.service';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { QueueEventsRegistryService } from 'src/queue-events/queue-events.service';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';

@Controller('achievements')
export class AchievementsController {
  constructor(
    private readonly achievementsService: AchievementsService,
    @InjectQueue('meal') private mealsQueue: Queue,

    private readonly QueueEvents: QueueEventsRegistryService,
  ) {}

  // @Get('test')
  async test() {
    const createMealDto = {
      imageName: 'test_image.png',
      mealType: 'breakfast',
      avgScore: 2,
      avgGrade: 'B',
      userId: 14,
      maxScore: 1,
      lowestGrade: 'C',
    };
    const job = await this.mealsQueue.add('create-meal', {
      ...createMealDto,
    });
    const result = await this.QueueEvents.waitForJobResult(
      job,
      this.mealsQueue,
    );
    return result;
  }

  @Get('page-info')
  @UseGuards(JwtAuthGuard)
  async getPageInfo(
    @Request() req: { user: { internalId: string; id: number } },
  ) {
    const result = await this.achievementsService.getPageInfo(req.user.id);
    return result;
  }
}
