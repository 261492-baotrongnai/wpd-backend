import {
  Body,
  Controller,
  Get,
  Logger,
  Post,
  Request,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { UserStatesService } from './user-states.service';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { Queue } from 'bullmq';
import { InjectQueue } from '@nestjs/bullmq';
import { QueueEventsRegistryService } from 'src/queue-events/queue-events.service';
import { FileInterceptor } from '@nestjs/platform-express';

@Controller('user-states')
export class UserStatesController {
  private readonly logger = new Logger(UserStatesController.name);
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

  @Post('upload-export-poster')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(FileInterceptor('file'))
  async uploadExportPoster(
    @Request() req: { user: { internalId: string; id: number } },
    @UploadedFile() file: Express.Multer.File,
    @Body('uid') uid: string,
  ) {
    this.logger.debug(`Uploading export poster for user ${uid}`);
    const filePath = await this.userStatesService.saveToUploadsDir(
      file,
      req.user.internalId,
    );
    if (!filePath) {
      this.logger.error('Failed to save file to uploads directory');
      throw new Error('Failed to save file');
    }
    this.logger.debug(`File saved to: ${filePath}`);
    const job = await this.userStateQueue.add('save-date-poster', {
      filePath: filePath,
      uid: uid,
      id: req.user.id,
      iid: req.user.internalId,
    });
    return this.queueEventsRegistryService.waitForJobResult(
      job,
      this.userStateQueue,
    );
  }
}
