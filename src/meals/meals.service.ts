import { Injectable, Logger } from '@nestjs/common';
import { CreateMealDto } from './dto/create-meal.dto';
// import { UpdateMealDto } from './dto/update-meal.dto';
import { Meal } from './entities/meal.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';

@Injectable()
export class MealsService {
  logger = new Logger(MealsService.name);

  constructor(
    @InjectRepository(Meal)
    private readonly mealsRepository: Repository<Meal>,
    private readonly entityManager: EntityManager,
  ) {}
  create(createMealDto: CreateMealDto) {
    const new_meal = new Meal({
      imageName: createMealDto.imageName,
      mealType: createMealDto.mealType,
      avgScore: createMealDto.avgScore,
      avgGrade: createMealDto.avgGrade,
      user: createMealDto.user,
    });

    return this.entityManager.save(new_meal);
  }

  findAll() {
    return `This action returns all meals`;
  }

  findOne(id: number) {
    return this.mealsRepository.findOne({ where: { id } });
  }

  findAllByUser(userId: number) {
    return this.mealsRepository.find({
      where: { user: { id: userId } },
      relations: ['user', 'foods'],
    });
  }

  // update(id: number, updateMealDto: UpdateMealDto) {
  //   return `This action updates a #${id} meal`;
  // }

  remove(id: number) {
    return `This action removes a #${id} meal`;
  }
}
