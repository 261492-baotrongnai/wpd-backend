import { Controller, Post, UseGuards, Request } from '@nestjs/common';
import { IdTokenAuthGuard } from './idToken-auth.guard'; // your new guard
import { AuthService } from './auth.service';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  @UseGuards(IdTokenAuthGuard)
  async login(@Request() req: { user: { internalId: string } }) {
    const user = req.user;
    const token = await this.authService.generateToken(user.internalId);
    return { access_token: token };
  }
}
