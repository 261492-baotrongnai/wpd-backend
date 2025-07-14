import { Controller, Post, UseGuards, Request } from '@nestjs/common';
import { IdTokenAuthGuard } from './idToken-auth.guard'; // your new guard
import { AuthService } from './auth.service';
import { AdminIdTokenAuthGuard } from './admin-idToken-auth.guard';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  @UseGuards(IdTokenAuthGuard)
  async login(@Request() req: { user: { internalId: string } }) {
    const user = req.user;
    const token = await this.authService.generateToken(user.internalId, 'user');
    return { access_token: token };
  }

  @Post('login-admin')
  @UseGuards(AdminIdTokenAuthGuard)
  async loginAdmin(@Request() req: { admin: { internalId: string } }) {
    const admin = req.admin;
    const token = await this.authService.generateToken(
      admin.internalId,
      'admin',
    );
    return { access_token: token };
  }
}
