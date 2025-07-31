import { Controller, Get, Query } from '@nestjs/common';
import { ChoiceLogsService } from './logs.service';

@Controller('choice-logs')
export class ChoiceLogsController {
  constructor(private readonly logsService: ChoiceLogsService) {}

  @Get('all-choice-logs')
  async getCompletedLogs() {
    return this.logsService.getAllCompletedLogs();
  }

}
