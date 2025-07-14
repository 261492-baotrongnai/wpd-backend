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

@Controller('admin')
export class AdminController {
  constructor(
    private readonly adminJobService: AdminJobService,
    @InjectQueue('admin') private readonly adminQueue: Queue,
  ) {}

  @Post('line-register')
  lineRegister(@Body() createAdminLineDto: CreateAdminLineDto) {
    return this.adminQueue.add('create-admin-line', createAdminLineDto);
  }

  @UseGuards(JwtAuthGuard)
  @Get('info')
  async getAdminInfo(
    @Request() req: { user: { internalId: string; id: number } },
  ) {
    return this.adminQueue.add('get-admin-info', {
      internalId: req.user.internalId,
      id: req.user.id,
    });
  }

  // @Post('email-register')
  // emailRegister(@Body() createAdminEmailDto: CreateAdminEmailDto) {
  //   return this.adminService.createEmail(createAdminEmailDto);
  // }
}
