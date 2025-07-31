import { Injectable } from '@nestjs/common';
import { Follower } from './entities/followers.entity';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';

@Injectable()
export class FollowersService {
  constructor(
    @InjectRepository(Follower)
    private readonly followersRepository: Repository<Follower>,
  ) {}

  async findAll(): Promise<Follower[]> {
    return this.followersRepository.find();
  }

  async addUserId(userId: string): Promise<Follower> {
    const newFollower = this.followersRepository.create({ userId });
    return this.followersRepository.save(newFollower);
  }
}
