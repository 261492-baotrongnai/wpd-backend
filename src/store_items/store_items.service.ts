import { Injectable, Logger } from '@nestjs/common';
import { EntityManager, Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { StoreItem } from './entities/store_item.entity';
import { User } from 'src/users/entities/user.entity';

@Injectable()
export class StoreItemsService {
  private readonly logger = new Logger(StoreItemsService.name);
  constructor(
    @InjectRepository(StoreItem)
    private readonly storeItemsRepository: Repository<StoreItem>,
    private readonly entityManager: EntityManager,
  ) {}

  async findAll(userId: number) {
    this.logger.log(`Finding all store items for user ID: ${userId}`);
    // Fetch only the columns we want to expose; do not load relations
    const storeItems = await this.storeItemsRepository.find({
      select: [
        'id',
        'name',
        'description',
        'pointsRequired',
        'imageName',
        'category',
      ],
    });

    const user = await this.entityManager.findOne(User, {
      where: { id: userId },
      relations: ['storeItems'],
    });
    if (!user) {
      // Return a DTO that excludes the `users` relation
      return {
        userPoints: null,
        storeItems: storeItems.map((item) => ({
          id: item.id,
          name: item.name,
          description: item.description,
          pointsRequired: item.pointsRequired,
          imageName: item.imageName,
          category: item.category,
          owned: false,
        })),
      };
    }

    const ownedItemIds = new Set(user.storeItems.map((item) => item.id));
    return {
      userPoints: user.points,
      storeItems: storeItems.map((item) => ({
        id: item.id,
        name: item.name,
        description: item.description,
        pointsRequired: item.pointsRequired,
        imageName: item.imageName,
        category: item.category,
        owned: ownedItemIds.has(item.id),
      })),
    };
  }

  async findOne(id: number) {
    return await this.storeItemsRepository.findOne({ where: { id } });
  }

  async buyItem(userId: number, itemId: number) {
    this.logger.log(`User ${userId} is attempting to buy item ${itemId}`);
    const user = await this.entityManager.findOne(User, {
      where: { id: userId },
      relations: ['storeItems'],
    });
    const item = await this.storeItemsRepository.findOne({
      where: { id: itemId },
    });

    if (!user || !item) {
      throw new Error('User or item not found');
    }

    if (user.points < item.pointsRequired) {
      throw new Error('Insufficient points');
    }

    if (user.storeItems.some((i) => i.id === item.id)) {
      throw new Error('Item already owned');
    }

    // Deduct points and associate item with user
    user.points -= item.pointsRequired;
    user.storeItems.push(item);

    const result = await this.entityManager.save(user);
    return result;
  }

  async getUserFrames(userId: number) {
    this.logger.log(`Fetching frames for user ID: ${userId}`);
    const user = await this.entityManager.findOne(User, {
      where: { id: userId },
      relations: ['storeItems', 'currentFrame'],
    });
    if (!user) {
      throw new Error('User not found');
    }
    const frames = user.storeItems.filter((item) => item.category === 'frame');
    return {
      currentFrame: user.currentFrame,
      frames: frames.map((item) => ({
        id: item.id,
        name: item.name,
        imageName: item.imageName,
        isSelected: user.currentFrameId === item.id,
      })),
    };
  }
}
