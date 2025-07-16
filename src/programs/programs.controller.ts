import {
  Body,
  Controller,
  Get,
  Logger,
  Post,
  Request,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { InjectQueue } from '@nestjs/bullmq';
import { Job, Queue, QueueEvents } from 'bullmq';
import { CreateProgramDto } from './dto/create.dto';

@Controller('program')
export class ProgramsController {
  private readonly logger = new Logger(ProgramsController.name);
  constructor(@InjectQueue('program') private readonly programQueue: Queue) {}

  private async waitForJobResult(job: Job, queue: Queue) {
    const queueEvents = new QueueEvents(queue.name, {
      connection: queue.opts.connection,
    });
    const result: unknown = await job.waitUntilFinished(queueEvents);
    await queueEvents.close();
    return result;
  }

  @Post('create')
  @UseGuards(JwtAuthGuard)
  async createProgram(
    @Request() req: { user: { internalId: string; id: number } },
    @Body()
    body: CreateProgramDto,
  ) {
    this.logger.debug(`Creating program with data: ${JSON.stringify(body)}`);
    const job = await this.programQueue.add('create-program', {
      id: req.user.id,
      body: body,
    });
    const result: unknown = await this.waitForJobResult(job, this.programQueue);
    return result;
  }

  @Get('info')
  @UseGuards(JwtAuthGuard)
  async getProgramInfo(
    @Request() req: { user: { internalId: string; id: number } },
  ) {
    this.logger.debug(`Fetching program info for ID: ${req.user.id}`);
    const job = await this.programQueue.add('get-program-info', {
      id: req.user.id,
    });
    const result: unknown = await this.waitForJobResult(job, this.programQueue);
    return result;
  }
}
