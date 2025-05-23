import { Controller, Get, Request, UseGuards } from '@nestjs/common';
import { UserStatesService } from './user-states.service';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';

@Controller('user-states')
export class UserStatesController {
  constructor(private readonly userStatesService: UserStatesService) {}

  @UseGuards(JwtAuthGuard)
  @Get('candidates')
  findCandidates(@Request() req: { user: { internalId: string; id: number } }) {
    return this.userStatesService.findCandidates(+req.user.id);
  }
}
