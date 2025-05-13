import { Controller, Get, Param } from '@nestjs/common';
import { UserStatesService } from './user-states.service';

@Controller('user-states')
export class UserStatesController {
  constructor(private readonly userStatesService: UserStatesService) {}

  @Get('candidates/:id')
  findCandidates(@Param('id') id: string) {
    return this.userStatesService.findCandidates(+id);
  }
}
