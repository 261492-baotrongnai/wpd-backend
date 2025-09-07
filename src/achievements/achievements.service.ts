import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Achievement } from './entities/achievement.entity';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { QueueEventsRegistryService } from 'src/queue-events/queue-events.service';
import { OnEvent } from '@nestjs/event-emitter';
import { UpdateAchievementEvent } from './events/update.event';
import { User } from 'src/users/entities/user.entity';
import { In } from 'typeorm';

@Injectable()
export class AchievementsService {
  private readonly logger = new Logger(AchievementsService.name);

  constructor(
    @InjectRepository(Achievement)
    private readonly achievementsRepository: Repository<Achievement>,
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,

    @InjectQueue('meal')
    private readonly mealQueue: Queue,

    @InjectQueue('user')
    private readonly userQueue: Queue,

    private readonly queueEvents: QueueEventsRegistryService,
  ) {}

  private achievementThresholds = [
    { id: 1, streak: 1 }, // daily record
    { id: 2, streak: 10 },
    { id: 3, streak: 30 },
    { id: 4, streak: 60 },
    { id: 5, streak: 90 },
  ];

  // Award points for first record of the day (re-usable daily, not a one-time achievement list addition)
  @OnEvent('user.daily.firstMeal')
  async handleDailyFirstMeal(event: { userId: number }) {
    const userId = Number(event.userId);
    const user = await this.usersRepository.findOne({ where: { id: userId } });
    if (!user) return;
    // Achievement id 1 represents daily record points template
    const template = await this.achievementsRepository.findOne({
      where: { id: 1 },
    });
    if (!template) return;
    const points = template.points || 0;
    if (points > 0) {
      await this.userQueue.add('add-points', {
        add_points: points,
        id: userId,
      });
      this.logger.log(
        `Daily first meal points (+${points}) granted to user ${userId}`,
      );
    }
  }

  private async awardAchievementsForStreak(user: User, streaks: number) {
    // Load existing achievements relation
    const freshUser = await this.usersRepository.findOne({
      where: { id: user.id },
      relations: ['achievements'],
    });
    if (!freshUser) return;
    const ownedIds = new Set((freshUser.achievements || []).map((a) => a.id));
    const toAwardIds = this.achievementThresholds
      .filter((t) => streaks >= t.streak && !ownedIds.has(t.id))
      .map((t) => t.id);

    if (toAwardIds.length === 0) return;

    const achievements = toAwardIds.length
      ? await this.achievementsRepository.findBy({ id: In(toAwardIds) })
      : [];
    freshUser.achievements = [
      ...(freshUser.achievements || []),
      ...achievements,
    ];

    // Sum points from new achievements
    const addPoints = achievements.reduce((sum, a) => sum + (a.points || 0), 0);
    if (addPoints > 0) {
      await this.userQueue.add('add-points', {
        add_points: addPoints,
        id: freshUser.id,
      });
    }
    await this.usersRepository.save(freshUser);
    this.logger.log(
      `Awarded achievements ${toAwardIds.join(',')} to user ${freshUser.id} (+${addPoints} pts)`,
    );
  }

  // Helper to compute effective streak (carry + current)
  async getEffectiveStreak(userId: number) {
    const user = await this.usersRepository.findOne({ where: { id: userId } });
    if (!user) return 0;
    return (user.carryStreak || 0) + (user.streaks || 0);
  }

  @OnEvent('user.streaks.updated')
  async updateStreaks(event: UpdateAchievementEvent) {
    const { userId } = event;
    const numericUserId = Number(userId);
    this.logger.log(`Updating achievement for user ${numericUserId}`);
    const streaksJob = await this.mealQueue.add('count-user-streaks', {
      userId: numericUserId,
    });
    const streakResult: number = (await this.queueEvents.waitForJobResult(
      streaksJob,
      this.mealQueue,
    )) as number;
    this.logger.log(`Streaks for user ${numericUserId}: ${streakResult}`);
    const userJob = await this.userQueue.add('update-streaks', {
      streaks: streakResult,
      id: numericUserId,
    });
    await this.queueEvents.waitForJobResult(userJob, this.userQueue);

    const user = await this.usersRepository.findOne({
      where: { id: numericUserId },
    });
    if (user) {
      const effectiveStreak = (user.carryStreak || 0) + streakResult;
      this.logger.log(
        `Effective streak for achievements user=${numericUserId}: carry=${user.carryStreak} current=${streakResult} total=${effectiveStreak}`,
      );
      await this.awardAchievementsForStreak(user, effectiveStreak);
    }
    return streakResult;
  }

  @OnEvent('user.totalDays.updated')
  async updateTotalDays(event: UpdateAchievementEvent) {
    const { userId } = event;
    this.logger.log(`Updating total days for user ${userId}`);
    const totalDaysJob = await this.mealQueue.add('count-total-days', {
      userId,
    });
    const totalDaysResult: number = (await this.queueEvents.waitForJobResult(
      totalDaysJob,
      this.mealQueue,
    )) as number;

    this.logger.log(`Total days for user ${userId}: ${totalDaysResult}`);
    const userJob = await this.userQueue.add('update-total-days', {
      totalDays: totalDaysResult,
      id: userId,
    });

    this.logger.log(`Waiting for user update job ${userJob.id} to complete`);
    const userResult = await this.queueEvents.waitForJobResult(
      userJob,
      this.userQueue,
    );
    this.logger.log(`User update job ${userJob.id} completed`, userResult);
    this.logger.log(`User update result: ${String(userResult)}`);
    return totalDaysResult;
  }
}
