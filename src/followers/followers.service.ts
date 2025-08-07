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
    try {
      const existingFollower = await this.followersRepository.findOne({
        where: { userId },
      });
      if (existingFollower) {
        return existingFollower; // Return existing follower if found
      }
      const newFollower = this.followersRepository.create({ userId });
      return this.followersRepository.save(newFollower);
    } catch (error) {
      console.error('Error adding user ID:', error);
      throw error;
    }
  }
}
