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
import { RecordCaseHandler } from 'src/webhooks/record-case';
import { ImagesService } from 'src/images/images.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Image } from 'src/images/entities/image.entity';
import { PendingUploadsService } from 'src/pending-uploads/pending-uploads.service';
import { PendingUpload } from 'src/pending-uploads/entities/pending-uploads.entity';
import { ExternalApiService } from 'src/external-api/external-api.service';

@Module({
  controllers: [AuthController],
  providers: [
    AuthService,
    JwtStrategy,
    WebhooksService,
    RecordCaseHandler,
    ImagesService,
    PendingUploadsService,
    ExternalApiService,
  ],
  imports: [
    UsersModule,
    UserStatesModule,
    JwtModule.register({
      secret: process.env.JWT_SECRET,
      signOptions: { expiresIn: '1h' },
    }),
    PassportModule,
    TypeOrmModule.forFeature([Image, PendingUpload]),
  ],
})
export class AuthModule {}
