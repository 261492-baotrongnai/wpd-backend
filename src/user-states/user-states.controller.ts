import { Controller, Get, Request, UseGuards } from '@nestjs/common';
import { UserStatesService } from './user-states.service';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { Queue } from 'bullmq';
import { InjectQueue } from '@nestjs/bullmq';
import { QueueEventsRegistryService } from 'src/queue-events/queue-events.service';

@Controller('user-states')
export class UserStatesController {
  constructor(
    private readonly userStatesService: UserStatesService,
    @InjectQueue('user-state') private readonly userStateQueue: Queue,
    private readonly queueEventsRegistryService: QueueEventsRegistryService,
  ) {}

  @UseGuards(JwtAuthGuard)
  @Get('candidates')
  async findCandidates(
    @Request() req: { user: { internalId: string; id: number } },
  ) {
    const job = await this.userStateQueue.add('get-candidates', req.user.id);
    return this.queueEventsRegistryService.waitForJobResult(
      job,
      this.userStateQueue,
    );
  }
}
