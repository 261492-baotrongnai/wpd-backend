import { Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { JwtService } from '@nestjs/jwt';
import { BullModule } from '@nestjs/bullmq';
import { FollowersModule } from 'src/followers/followers.module';
import { QueueEventsRegistryService } from 'src/queue-events/queue-events.service';
import { UserProcessor } from './workers/users.worker';
import { StoreItemsModule } from 'src/store_items/store_items.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([User]),
    FollowersModule,
    BullModule.registerQueue({ name: 'program' }),
    BullModule.registerQueue({ name: 'follower' }),
    BullModule.registerQueue({ name: 'user' }),
    BullModule.registerQueue({ name: 'meal' }),

    StoreItemsModule,
  ],
  controllers: [UsersController],
  providers: [
    UsersService,
    JwtService,
    QueueEventsRegistryService,
    UserProcessor,
  ],
  exports: [UsersService, TypeOrmModule],
})
export class UsersModule {}
