import {
  Body,
  Controller,
  Get,
  Logger,
  NotFoundException,
  Post,
  Request,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
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
    const result: unknown =
      await this.queueEventsRegistryService.waitForJobResult(
        job,
        this.programQueue,
      );
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
    const result: unknown =
      await this.queueEventsRegistryService.waitForJobResult(
        job,
        this.programQueue,
      );
    return result;
  }

  @Post('validate-code')
  @UseGuards(ShortTokenGuard)
  async validateProgram(@Body('code') code: string) {
    const job = await this.programQueue.add('validate-code', {
      code: code,
    });
    try {
      const result = await this.queueEventsRegistryService.waitForJobResult(
        job,
        this.programQueue,
      );
      if (result === true) {
        this.logger.debug(`Program code ${code} is valid.`);
        return { valid: true };
      } else {
        this.logger.warn(`Program code ${code} is invalid.`);
        throw new NotFoundException(`Program code ${code} does not exist`);
      }
    } catch (error) {
      this.logger.error(`Error validating program code ${code}: ${error}`);
      throw error;
    }
  }
}
