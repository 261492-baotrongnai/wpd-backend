import { Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { JwtService } from '@nestjs/jwt';
import { ProgramsModule } from 'src/programs/programs.module';
import { BullModule } from '@nestjs/bullmq';
import { FollowersModule } from 'src/followers/followers.module';
import { QueueEventsRegistryService } from 'src/queue-events/queue-events.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([User]),
    ProgramsModule,
    FollowersModule,
    BullModule.registerQueue({ name: 'program' }),
    BullModule.registerQueue({ name: 'follower' }),
  ],
  controllers: [UsersController],
  providers: [UsersService, JwtService, QueueEventsRegistryService],
  exports: [UsersService],
})
export class UsersModule {}
