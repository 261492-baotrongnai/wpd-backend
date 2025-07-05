import {
  BadRequestException,
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthService } from './auth.service';

@Injectable()
export class AdminIdTokenAuthGuard implements CanActivate {
  constructor(private readonly authService: AuthService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context
      .switchToHttp()
      .getRequest<{ body: { idToken: string }; admin?: any }>();
    const { idToken } = request.body;

    if (!idToken) {
      throw new BadRequestException('No idToken provided');
    }

    const admin = await this.authService.validateAdmin(idToken);

    if (!admin) {
      // const userId = await verifyIdToken(idToken);
      // await this.webhookService.handleNonRegisteredUser(userId);
      throw new UnauthorizedException(
        `Invalid idToken, please classify and agree terms and conditions before using`,
      );
    }

    request.admin = admin; // Attach admin to request
    return true;
  }
}
