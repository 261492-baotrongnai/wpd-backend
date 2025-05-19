import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { UsersService } from 'src/users/users.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private readonly userService: UsersService) {
    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      throw new Error('JWT_SECRET environment variable is not set');
    }
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: jwtSecret,
    });
  }
  // Validate the JWT payload //
  async validate(payload: { internalId: string }) {
    console.log('JWT payload:', payload);
    const user = await this.userService.findUserByInternalId(
      payload.internalId,
    );
    if (!user) {
      throw new Error('User not found');
    }
    console.log('User found:', user.id);
    return { internalId: payload.internalId, id: user.id };
  }
}
