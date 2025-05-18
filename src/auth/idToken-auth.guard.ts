import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { WebhooksService } from 'src/webhooks/webhooks.service';
// import { verifyIdToken } from 'src/users/user-utility';

@Injectable()
export class IdTokenAuthGuard implements CanActivate {
  constructor(
    private readonly authService: AuthService,
    private readonly webhookService: WebhooksService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context
      .switchToHttp()
      .getRequest<{ body: { idToken: string }; user?: any }>();
    const { idToken } = request.body;

    if (!idToken) {
      throw new UnauthorizedException('No idToken provided');
    }

    const user = await this.authService.validateUser(idToken);

    if (!user) {
      // const userId = await verifyIdToken(idToken);
      // await this.webhookService.handleNonRegisteredUser(userId);
      throw new UnauthorizedException(
        `Invalid idToken, please classify and agree terms and conditions before using`,
      );
    }

    request.user = user; // Attach user to request
    return true;
  }
}
