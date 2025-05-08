import { Module } from '@nestjs/common';

import { ConfigModule } from '@nestjs/config';
import { DatabaseModule } from './database/database.module';
import { ImagesModule } from './images/images.module';
import { UsersModule } from './users/users.module';
import { WebhooksController } from './webhooks/webhooks.controller';
import { WebhooksService } from './webhooks/webhooks.service';
import { AuthModule } from './auth/auth.module';
import { UserStatesModule } from './user-states/user-states.module';
import { RecordCaseHandler } from './webhooks/record-case';
import { PendingUploadsModule } from './pending-uploads/pending-uploads.module';
import { ExternalApiModule } from './external-api/external-api.module';
@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, envFilePath: '.env' }),
    DatabaseModule,
    ImagesModule,
    UsersModule,
    AuthModule,
    UserStatesModule,
    PendingUploadsModule,
    ExternalApiModule,
  ],
  controllers: [WebhooksController],
  providers: [WebhooksService, RecordCaseHandler],
})
export class AppModule {}
