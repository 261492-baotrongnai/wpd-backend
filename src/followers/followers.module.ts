import { Module } from '@nestjs/common';
import { FollowersService } from './followers.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Follower } from './entities/followers.entity';
import { BullModule } from '@nestjs/bullmq';
import { FollowersJobService } from './followers.job';
import { FollowerProcessor } from './followers.worker';

@Module({
  imports: [
    TypeOrmModule.forFeature([Follower]),
    BullModule.registerQueue({ name: 'follower' }),
  ],
  providers: [FollowersService, FollowersJobService, FollowerProcessor],
})
export class FollowersModule {}
