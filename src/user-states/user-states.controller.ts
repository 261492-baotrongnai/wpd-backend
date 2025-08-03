import { Controller, Get, Request, UseGuards } from '@nestjs/common';
import { UserStatesService } from './user-states.service';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { Job, Queue, QueueEvents } from 'bullmq';
import { InjectQueue } from '@nestjs/bullmq';

@Controller('user-states')
export class UserStatesController {
  constructor(
    private readonly userStatesService: UserStatesService,
    @InjectQueue('user-state') private readonly userStateQueue: Queue,
  ) {}

  private async waitForJobResult(job: Job, queue: Queue) {
    const queueEvents = new QueueEvents(queue.name, {
      connection: queue.opts.connection,
    });
    const result: unknown = await job.waitUntilFinished(queueEvents);
    await queueEvents.close();
    return result;
  }

  @UseGuards(JwtAuthGuard)
  @Get('candidates')
  async findCandidates(
    @Request() req: { user: { internalId: string; id: number } },
  ) {
    const job = await this.userStateQueue.add('get-candidates', req.user.id);
    return this.waitForJobResult(job, this.userStateQueue);
  }
}
