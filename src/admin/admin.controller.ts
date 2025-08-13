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
import { Queue } from 'bullmq';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { QueueEventsRegistryService } from 'src/queue-events/queue-events.service';
import { Organization } from 'src/organizations/entities/organization.entity';

@Controller('admin')
export class AdminController {
  constructor(
    private readonly adminJobService: AdminJobService,
    @InjectQueue('admin') private readonly adminQueue: Queue,
    private readonly queueEventsRegistryService: QueueEventsRegistryService,
  ) {}

  @Post('line-register')
  async lineRegister(@Body() createAdminLineDto: CreateAdminLineDto) {
    const job = await this.adminQueue.add(
      'create-admin-line',
      createAdminLineDto,
    );
    const result: unknown =
      await this.queueEventsRegistryService.waitForJobResult(
        job,
        this.adminQueue,
      );
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
    const result: unknown =
      await this.queueEventsRegistryService.waitForJobResult(
        job,
        this.adminQueue,
      );
    return result;
  }

  @UseGuards(JwtAuthGuard)
  @Get('find-organization-admins')
  async findOrganizationAdmins(@Request() req: { user: { id: number } }) {
    const job = await this.adminQueue.add('find-organization-admins', {
      adminId: req.user.id,
    });
    const result = (await this.queueEventsRegistryService.waitForJobResult(
      job,
      this.adminQueue,
    )) as Organization[];
    return result;
  }

  // @Post('email-register')
  // emailRegister(@Body() createAdminEmailDto: CreateAdminEmailDto) {
  //   return this.adminService.createEmail(createAdminEmailDto);
  // }
}
