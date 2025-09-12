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
    const storeItems = await this.storeItemsRepository.find();

    const user = await this.entityManager.findOne(User, {
      where: { id: userId },
      relations: ['storeItems'],
    });
    if (!user) {
      return storeItems.map((item) => ({ ...item, owned: false }));
    } else {
      const ownedItemIds = new Set(user.storeItems.map((item) => item.id));
      const result = storeItems.map((item) => ({
        ...item,
        owned: ownedItemIds.has(item.id),
      }));
      return result;
    }
  }

  async findOne(id: number) {
    return await this.storeItemsRepository.findOne({ where: { id } });
  }

  async buyItem(userId: number, itemId: number) {
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
}
