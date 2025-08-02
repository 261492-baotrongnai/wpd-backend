import {
  BadRequestException,
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthService } from './auth.service';

@Injectable()
export class IdTokenAuthGuard implements CanActivate {
  constructor(private readonly authService: AuthService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context
      .switchToHttp()
      .getRequest<{ body: { idToken: string }; user?: any }>();
    const { idToken } = request.body;

    if (!idToken) {
      throw new BadRequestException('No idToken provided');
    }

    const user = await this.authService.validateUser(idToken);

    if (!user) {
      throw new UnauthorizedException(
        `Invalid idToken, please classify and agree terms and conditions before using`,
      );
    }

    request.user = user; // Attach user to request
    return true;
  }
}
