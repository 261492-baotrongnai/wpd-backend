import { Injectable } from '@nestjs/common';
import { UsersService } from 'src/users/users.service';
import { JwtService } from '@nestjs/jwt';
import { getInternalId } from 'src/users/user-utility';
import { AdminService } from 'src/admin/admin.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly adminService: AdminService,
  ) {}
  async generateToken(
    internalId: string,
    roles: string[],
    expiresIn: string = '1h',
  ): Promise<string> {
    const secretKey = process.env.JWT_SECRET;
    return await this.jwtService.signAsync(
      { internalId, roles },
      { secret: secretKey, expiresIn: expiresIn },
    );
  }

  async decodeToken(
    token: string,
  ): Promise<{ internalId: string; roles: string[] }> {
    const secretKey = process.env.JWT_SECRET;
    return await this.jwtService.verifyAsync<{
      internalId: string;
      roles: string[];
    }>(token, { secret: secretKey });
  }

  async validateUser(LineIdToken: string) {
    try {
      const result = await getInternalId(LineIdToken, undefined);
      if (typeof result !== 'string') {
        console.error(
          'Error validate user by lineIdToken: Invalid result type from getInternalId in validateUser',
        );
        return null; // Return null for invalid tokens
      }

      const internalId: string = result;
      const user = await this.usersService.findUserByInternalId(internalId);
      if (!user) {
        console.error('User not found or terms not agreed');
        return null; // Return null if user is not found
      }

      return user; // Return the user if validation is successful
    } catch (error) {
      console.error('Error during user validation:', error);
      return null; // Return null for any unexpected errors
    }
  }

  async validateAdmin(LineIdToken: string) {
    try {
      const result = await getInternalId(LineIdToken, undefined);
      if (typeof result !== 'string') {
        console.error(
          'Error validate admin by lineIdToken: Invalid result type from getInternalId in validateAdmin',
        );
        return null; // Return null for invalid tokens
      }

      const internalId: string = result;
      const admin = await this.adminService.findAdminByInternalId(internalId);
      if (!admin) {
        console.error('Admin not found or terms not agreed');
        return null; // Return null if admin is not found
      }

      return admin; // Return the admin if validation is successful
    } catch (error) {
      console.error('Error during admin validation:', error);
      return null; // Return null for any unexpected errors
    }
  }
}
