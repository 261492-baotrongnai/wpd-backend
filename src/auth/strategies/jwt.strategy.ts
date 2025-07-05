import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { AdminService } from 'src/admin/admin.service';
import { UsersService } from 'src/users/users.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private readonly userService: UsersService,
    private readonly adminService: AdminService,
  ) {
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
  async validate(payload: { internalId: string; role: string }) {
    console.log('JWT payload:', payload);
    if (payload.role === 'admin') {
      const admin = await this.adminService.findAdminByInternalId(
        payload.internalId,
      );
      if (!admin) {
        throw new Error('Admin not found');
      }
      console.log('Admin found:', admin.id);
      return { internalId: payload.internalId, id: admin.id, role: 'admin' };
    }
    if (payload.role === 'user') {
      const user = await this.userService.findUserByInternalId(
        payload.internalId,
      );
      if (!user) {
        throw new Error('User not found');
      }
      console.log('User found:', user.id);
      return { internalId: payload.internalId, id: user.id, role: 'user' };
    }
  }
}
