import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';
import Redis from 'ioredis';

@Injectable()
export class TokenService {
  private redis: Redis;
  private readonly logger = new Logger(TokenService.name);

  constructor(private configService: ConfigService) {
    this.redis = new Redis({
      host: this.configService.get<string>('REDIS_HOST') || '127.0.0.1',
      port: this.configService.get<number>('REDIS_PORT') || 6379,
      password: this.configService.get<string>('REDIS_PASSWORD'),
    });
  }

  async generateToken(ttlSeconds = 300): Promise<string> {
    const token = crypto.randomBytes(32).toString('hex');
    await this.redis.set(token, '1', 'EX', ttlSeconds);
    return token;
  }

  async validateToken(token: string): Promise<boolean> {
    const exists = await this.redis.exists(token);
    this.logger.debug(`'Token validation: ${token}, Exists: ${exists}`);
    if (exists) {
      await this.redis.del(token); // one-time use
      return true;
    }
    return false;
  }
}
