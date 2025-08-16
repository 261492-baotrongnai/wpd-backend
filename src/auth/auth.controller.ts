import { Controller, Post, UseGuards, Request, Get } from '@nestjs/common';
import { IdTokenAuthGuard } from './idToken-auth.guard'; // your new guard
import { AuthService } from './auth.service';
import { AdminIdTokenAuthGuard } from './admin-idToken-auth.guard';
import { TokenService } from './token.service';
import { JwtAuthGuard } from './jwt-auth.guard';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly tokenService: TokenService,
  ) {}

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
      '7d',
    );
    return { access_token: token };
  }

  @Get('short-token')
  async getShortToken() {
    const token = await this.tokenService.generateToken(300);
    return { token };
  }

  @Get('validate-token')
  @UseGuards(JwtAuthGuard)
  validateToken(@Request() req: { user: { internalId: string; id: number } }) {
    console.log('Validating token for user:', req.user.internalId);
    return { valid: true };
  }
}
