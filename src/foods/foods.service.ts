import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { CreateFoodDto } from './dto/create-food.dto';
// import { UpdateFoodDto } from './dto/update-food.dto';
import { Food } from './entities/food.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';
import { Admin } from 'src/admin/entities/admin.entity';
import { Meal } from 'src/meals/entities/meal.entity';
import { EditFoodDto } from './dto/edit-food.dto';

import * as fuzzball from 'fuzzball';

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

  async getWaitingConfirmationFoods(id: number) {
    this.logger.log('Fetching waiting confirmation foods');

    const admin = await this.entityManager.findOne(Admin, {
      where: { id },
    });

    if (!admin || !admin.isEditor) {
      this.logger.error(`Admin with ID ${id} not found`);
      throw new UnauthorizedException(`Admin with ID ${id} not found`);
    }

    const food = await this.foodRepository.find({
      where: { grading_by_ai: true },
      relations: ['meal'],
    });
    this.logger.log(`Found `, food, `waiting for confirmation`);
    const result = await Promise.all(
      food.map(async (f) => {
        const m = await this.entityManager.findOne(Meal, {
          where: { id: f.meal.id },
          relations: ['user'],
        });
        return {
          ...f,
          meal: m,
          key: m && m.user ? `meal_images/${m.user.id}/${m.imageName}` : null,
        };
      }),
    );

    this.logger.log(`Returning result:`, result);

    return result;
    // return 'okay';
  }

  async edit(editFoodDto: EditFoodDto) {
    this.logger.log('Editing food with data:', editFoodDto);
    const food = await this.foodRepository.findOne({
      where: { id: editFoodDto.id },
    });

    if (!food) {
      this.logger.error(`Food with ID ${editFoodDto.id} not found`);
      throw new Error(`Food with ID ${editFoodDto.id} not found`);
    }

    food.suggested_name = editFoodDto.name;
    if (editFoodDto.description !== food.description) {
      food.unconfirmed_description = food.description;
    }
    food.description = editFoodDto.description;
    if (editFoodDto.grade !== food.grade) {
      food.unconfirmed_grade = food.grade;
    }
    food.grade = editFoodDto.grade;

    food.is_confirmed = editFoodDto.is_confirmed;
    food.is_rejected = editFoodDto.is_rejected;
    return this.foodRepository.save(food);
  }

  async getListOfSimilarityFoodNames() {
    this.logger.log('Fetching list of similarity foods');
    const foods = await this.foodRepository.find({
      where: { grading_by_ai: true },
    });

    // Debug: Log all fetched foods
    this.logger.debug('Fetched foods:', foods);

    // Group foods by similar names (fuzzy match > 80%)
    const groups: { [key: string]: Food[] } = {};

    for (const food of foods) {
      let foundKey: string | null = null;
      for (const key of Object.keys(groups)) {
        const similarity = fuzzball.token_set_ratio(food.name, key);
        this.logger.debug(
          `Comparing "${food.name}" with "${key}": similarity=${similarity}`,
        );
        if (similarity > 85 && similarity < 100) {
          foundKey = key;
          break;
        }
      }
      if (foundKey) {
        groups[foundKey].push(food);
        this.logger.debug(`Added "${food.name}" to group "${foundKey}"`);
      } else {
        groups[food.name] = [food];
        this.logger.debug(`Created new group for "${food.name}"`);
      }
    }

    // Filter groups with more than one unique grade
    const result = Object.entries(groups)
      .map(([name, groupFoods]) => {
        const grades = groupFoods.map((f) => f.grade); // <-- collect all grades, not distinct
        this.logger.debug(`Group "${name}" has grades:`, grades);
        if (new Set(grades).size > 1) {
          // still check for more than one unique grade
          return {
            names: groupFoods.map((f) => f.name),
            grades,
            counts: groupFoods.length,
            food_from_db: [name],
          };
        }
        return null;
      })
      .filter(Boolean);

    this.logger.debug('Final result:', result);

    return result;
  }
}
