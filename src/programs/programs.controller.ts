import {
  BadRequestException,
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
import { Job, Queue } from 'bullmq';
import { CreateProgramDto } from './dto/create.dto';
import { ShortTokenGuard } from 'src/auth/short-token.guard';
import { QueueEventsRegistryService } from 'src/queue-events/queue-events.service';

@Controller('program')
export class ProgramsController {
  private readonly logger = new Logger(ProgramsController.name);
  constructor(
    @InjectQueue('program') private readonly programQueue: Queue,
    private readonly queueEventsRegistryService: QueueEventsRegistryService,
  ) {}

  private async waitForJobResult(job: Job, queue: Queue) {
    const queueEvents = this.queueEventsRegistryService.getQueueEvents(queue);
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

  @Post('validate-code')
  @UseGuards(ShortTokenGuard)
  async validateProgram(@Body('code') code: string) {
    const job = await this.programQueue.add('validate-code', {
      code: code,
    });
    const result: boolean = (await this.waitForJobResult(
      job,
      this.programQueue,
    )) as boolean;

    if (!result) {
      this.logger.error(`Program code ${code} does not exist ${result}`);
      throw new BadRequestException('Program code does not exist');
    }
    return { isExist: result };
  }
}
