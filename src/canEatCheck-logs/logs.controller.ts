import { Controller, Get, Query } from '@nestjs/common';
import { userDecideQueueService } from './logs.service';

@Controller('canEatCheck-user-decide')
export class userDecideQueueController {
  constructor(private readonly logsService: userDecideQueueService) {}

  // @Get('all-isRecord-logs')
  // async getCompletedLogs() {
  //   return this.logsService.getAllCompletedLogs();
  // }

}
