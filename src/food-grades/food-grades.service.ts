import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FoodGrade, FoodGradeType } from './entities/food-grade.entity';
import { EntityManager, Repository } from 'typeorm';
import { CreateFoodGradeDto } from './dto/create-food-grade.dto';
import * as fuzzball from 'fuzzball';
import { ExternalApiService } from 'src/external-api/external-api.service';
// import { UpdateFoodGradeDto } from './dto/update-food-grade.dto';

@Injectable()
export class FoodGradesService {
  logger = new Logger(FoodGradesService.name);
  constructor(
    @InjectRepository(FoodGrade)
    private readonly foodGradesRepository: Repository<FoodGrade>,
    private readonly api: ExternalApiService,
    private readonly entityManager: EntityManager,
  ) {}

  async create(createFoodGradeDto: CreateFoodGradeDto) {
    const grade = createFoodGradeDto.grade;
    const category = createFoodGradeDto.category;
    for (const name of createFoodGradeDto.names) {
      const foodGrade = new FoodGrade();
      foodGrade.grade = grade;
      foodGrade.category = category;
      foodGrade.name = name;
      await this.foodGradesRepository.save(foodGrade);
    }
    return this.foodGradesRepository.find({
      where: { grade, category },
    });
  }

  findAll() {
    return this.foodGradesRepository.find();
  }

  findOne(id: number) {
    return `This action returns a #${id} foodGrade`;
  }

  async getMenuGrade(menus: string[]) {
    try {
      let totalGrade = 0;
      const foods: Array<{
        name: string;
        grade: FoodGradeType;
        description: string;
        grading_by_ai: boolean;
      }> = [];
      for (const menu of menus) {
        // step 1: exact matching
        const exactFoodGrade = await this.foodGradesRepository.findOne({
          where: { name: menu },
        });

        if (exactFoodGrade) {
          this.logger.debug(
            `Exact match found for menu: ${menu} with ${exactFoodGrade.name}, grade: ${exactFoodGrade.grade}`,
          );
          const { grade } = exactFoodGrade;
          totalGrade += this.gradeToScore(grade);
          foods.push({
            name: menu,
            grade: this.validateGrade(exactFoodGrade.grade),
            description: `exactly match with {id: ${exactFoodGrade.id}, food: ${exactFoodGrade.name}, grade: ${exactFoodGrade.grade} } in database`,
            grading_by_ai: false,
          });
          continue;
        }

        // step 2: partial matching
        const allFood = await this.foodGradesRepository.find();
        const bestMatch = fuzzball.extract(
          menu,
          allFood.map((f) => f.name),
          { scorer: fuzzball.ratio },
        );

        if (bestMatch[0][1] > 80) {
          const matchedFood = allFood.find((f) => f.name === bestMatch[0][0]);
          if (matchedFood) {
            this.logger.debug(
              `Partial match found for menu: ${menu} with ${matchedFood.name}, grade: ${matchedFood.grade}`,
            );
            const { grade } = matchedFood;
            totalGrade += this.gradeToScore(grade);
            foods.push({
              name: menu,
              grade: this.validateGrade(matchedFood.grade),
              description: `partially match(over 80%) with {id: ${matchedFood.id}, food: ${matchedFood.name}, grade: ${matchedFood.grade} } in database`,
              grading_by_ai: false,
            });
            continue;
          }
        }
        // step 3: no match, send to Gemini
        const top5BestMatch = this.getTop5BestMatch(bestMatch, allFood);
        await this.api
          .geminiRequestGrade(menu, top5BestMatch)
          .then((response) => {
            if (response === null)
              throw new Error('Gemini detected non food name');
            totalGrade += this.gradeToScore(response.answer);
            foods.push({
              name: menu,
              grade: this.validateGrade(response.answer),
              description: response.descp,
              grading_by_ai: true,
            });
          });

        continue;
      }

      const scores = foods.map((food) => { return this.gradeToScore(food.grade) })
      const maxScore = Math.max(...scores);

      return {
        lowestGrade: this.scoreToGrade(maxScore),
        maxScore: maxScore,
        avgGrade: this.scoreToGrade(totalGrade / menus.length),
        avgScore: totalGrade / menus.length,
        foods,
      };
    } catch (error) {
      this.logger.error('Error at [getMenuGrade]:', error);
      throw error;
    }
  }

  getTop5BestMatch(
    bestMatch: [string, number][],
    allFood: FoodGrade[],
  ): { name: string; grade: string }[] {
    return bestMatch.slice(0, 5).map((match) => {
      const matchedFood = allFood.find((f) => f.name === match[0]);
      return {
        name: match[0],
        grade: matchedFood ? matchedFood.grade : 'N/A',
      };
    });
  }

  gradeToScore(grade: FoodGradeType): number {
    switch (grade) {
      case 'A':
        return 1;
      case 'B':
        return 2;
      case 'C':
        return 3;
      default:
        return 0;
    }
  }

  validateGrade(grade: string): FoodGradeType {
    if (grade === 'A' || grade === 'B' || grade === 'C') {
      return grade;
    }
    throw new Error(`Invalid grade: ${grade}`);
  }

  scoreToGrade(score: number): FoodGradeType {
    if (score <= 1.5) {
      return 'A';
    }
    if (score <= 2.5) {
      return 'B';
    }
    return 'C';
  }
}
