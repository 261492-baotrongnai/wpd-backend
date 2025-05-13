import { Injectable, Logger } from '@nestjs/common';
import { CreateFoodDto } from './dto/create-food.dto';
import { UpdateFoodDto } from './dto/update-food.dto';
import { Food } from './entities/food.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';

@Injectable()
export class FoodsService {
  logger = new Logger(FoodsService.name);
  constructor(
    @InjectRepository(Food)
    private readonly foodRepository: Repository<Food>,
    private readonly entityManager: EntityManager,
  ) {}

  async create(createFoodDto: CreateFoodDto) {
    const new_food = new Food(createFoodDto);
    return this.foodRepository.save(new_food);
  }

  findAll() {
    return `This action returns all foods`;
  }

  findOne(id: number) {
    return `This action returns a #${id} food`;
  }

  update(id: number, updateFoodDto: UpdateFoodDto) {
    return `This action updates a #${id} food`;
  }

  remove(id: number) {
    return `This action removes a #${id} food`;
  }
}
