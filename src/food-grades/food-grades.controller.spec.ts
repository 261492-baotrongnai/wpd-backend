import { Test, TestingModule } from '@nestjs/testing';
import { FoodGradesController } from './food-grades.controller';
import { FoodGradesService } from './food-grades.service';

describe('FoodGradesController', () => {
  let controller: FoodGradesController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [FoodGradesController],
      providers: [FoodGradesService],
    }).compile();

    controller = module.get<FoodGradesController>(FoodGradesController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
