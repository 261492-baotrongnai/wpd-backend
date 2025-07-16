import {
  Controller,
  Post,
  Body,
  UseGuards,
  Get,
  Request,
} from '@nestjs/common';
import {
  // CreateAdminEmailDto,
  CreateAdminLineDto,
} from './dto/create-admin.dto';
import { AdminJobService } from './admin-job.service';
import { InjectQueue } from '@nestjs/bullmq';
import { Job, Queue, QueueEvents } from 'bullmq';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';

@Controller('admin')
export class AdminController {
  constructor(
    private readonly adminJobService: AdminJobService,
    @InjectQueue('admin') private readonly adminQueue: Queue,
  ) {}

  private async waitForJobResult(job: Job, queue: Queue) {
    const queueEvents = new QueueEvents(queue.name, {
      connection: queue.opts.connection,
    });
    const result: unknown = await job.waitUntilFinished(queueEvents);
    await queueEvents.close();
    return result;
  }

  @Post('line-register')
  async lineRegister(@Body() createAdminLineDto: CreateAdminLineDto) {
    const job = await this.adminQueue.add(
      'create-admin-line',
      createAdminLineDto,
    );
    const result: unknown = await this.waitForJobResult(job, this.adminQueue);
    return result;
  }

  @UseGuards(JwtAuthGuard)
  @Get('info')
  async getAdminInfo(
    @Request() req: { user: { internalId: string; id: number } },
  ) {
    const job = await this.adminQueue.add('get-admin-info', {
      internalId: req.user.internalId,
      id: req.user.id,
    });
    const result: unknown = await this.waitForJobResult(job, this.adminQueue);
    return result;
  }

  // @Post('email-register')
  // emailRegister(@Body() createAdminEmailDto: CreateAdminEmailDto) {
  //   return this.adminService.createEmail(createAdminEmailDto);
  // }
}
