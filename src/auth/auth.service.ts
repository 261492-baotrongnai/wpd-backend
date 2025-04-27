import { Injectable } from '@nestjs/common';
import { UsersService } from 'src/users/users.service';
import { JwtService } from '@nestjs/jwt';
import { getInternalId } from 'src/users/user-utility';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
  ) {}
  async generateToken(internalId: string): Promise<string> {
    const secretKey = process.env.JWT_SECRET;
    return await this.jwtService.signAsync(
      { internalId, role: 'user' },
      { secret: secretKey, expiresIn: '1h' },
    );
  }

  async decodeToken(
    token: string,
  ): Promise<{ internalId: string; role: string }> {
    const secretKey = process.env.JWT_SECRET;
    return await this.jwtService.verifyAsync<{
      internalId: string;
      role: string;
    }>(token, { secret: secretKey });
  }

  async validateUser(LineIdToken: string) {
    try {
      const result = await getInternalId(LineIdToken, undefined);
      if (typeof result !== 'string') {
        console.error(
          'Error verifying ID token: Invalid result type from getInternalId in validateUser',
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
}
