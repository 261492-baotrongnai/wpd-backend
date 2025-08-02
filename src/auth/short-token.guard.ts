import {
  CanActivate,
  ExecutionContext,
  Injectable,
  ForbiddenException,
} from '@nestjs/common';
import { TokenService } from './token.service';
import { Request } from 'express';

@Injectable()
export class ShortTokenGuard implements CanActivate {
  constructor(private readonly tokenService: TokenService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const token = request.headers['x-short-token'];
    if (
      typeof token === 'string' &&
      (await this.tokenService.validateToken(token))
    ) {
      return true;
    }
    throw new ForbiddenException('Invalid or expired token');
  }
}
