import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import { FoodsService } from './foods.service';
import { QueueEventsRegistryService } from 'src/queue-events/queue-events.service';
import { InjectQueue } from '@nestjs/bullmq';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { Queue } from 'bullmq';

@Controller('food')
export class FoodsController {
  constructor(
    private readonly foodsService: FoodsService,
    private readonly queueEventsRegistryService: QueueEventsRegistryService,
    @InjectQueue('food') private readonly foodQueue: Queue,
  ) {}

  @Get('waiting-confirmation')
  @UseGuards(JwtAuthGuard)
  async confirmPending(
    @Req() req: { user: { internalId: string; id: number } },
  ) {
    const job = await this.foodQueue.add('get-waiting-confirmation', {
      userId: req.user.id,
    });
    const result = await this.queueEventsRegistryService.waitForJobResult(
      job,
      this.foodQueue,
    );
    return result;
  }

  @Get('is-editor')
  @UseGuards(JwtAuthGuard)
  async isEditor(@Req() req: { user: { internalId: string; id: number } }) {
    const job = await this.foodQueue.add('check-editor-status', {
      userId: req.user.id,
    });
    const result = await this.queueEventsRegistryService.waitForJobResult(
      job,
      this.foodQueue,
    );
    return result;
  }
}
