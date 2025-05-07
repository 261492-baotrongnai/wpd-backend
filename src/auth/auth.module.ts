import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { UsersModule } from 'src/users/users.module';
import { JwtModule } from '@nestjs/jwt';
// import { LocalStrategy } from './strategies/local.strategy';
import { PassportModule } from '@nestjs/passport';
import { JwtStrategy } from './strategies/jwt.strategy';
import { WebhooksService } from 'src/webhooks/webhooks.service';
import { UserStatesModule } from 'src/user-states/user-states.module';
import { WaitingCaseHandler } from 'src/webhooks/waiting-case';
import { ImagesService } from 'src/images/images.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Image } from 'src/images/entities/image.entity';

@Module({
  controllers: [AuthController],
  providers: [
    AuthService,
    JwtStrategy,
    WebhooksService,
    WaitingCaseHandler,
    ImagesService,
  ],
  imports: [
    UsersModule,
    UserStatesModule,
    JwtModule.register({
      secret: process.env.JWT_SECRET,
      signOptions: { expiresIn: '1h' },
    }),
    PassportModule,
    TypeOrmModule.forFeature([Image]),
  ],
})
export class AuthModule {}
