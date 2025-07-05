import { Controller, Post, Body } from '@nestjs/common';
import {
  // CreateAdminEmailDto,
  CreateAdminLineDto,
} from './dto/create-admin.dto';
import { AdminJobService } from './admin-job.service';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';

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

  // @Post('email-register')
  // emailRegister(@Body() createAdminEmailDto: CreateAdminEmailDto) {
  //   return this.adminService.createEmail(createAdminEmailDto);
  // }
}
