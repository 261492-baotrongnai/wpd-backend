import { Injectable, Logger } from '@nestjs/common';
import { FollowersService } from './followers.service';

@Injectable()
export class FollowersJobService {
  private readonly logger = new Logger(FollowersJobService.name);
  constructor(private readonly followersService: FollowersService) {}
  async handleCreateFollowerJob(uid: string) {
    this.logger.debug(`Creating follower with UID: ${uid}`);
    return await this.followersService.addUserId(uid);
  }

  async handleGetUserIdJob() {
    return await this.followersService.findAll();
  }
}
