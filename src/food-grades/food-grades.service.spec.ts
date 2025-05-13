import { Test, TestingModule } from '@nestjs/testing';
import { FoodGradesService } from './food-grades.service';

describe('FoodGradesService', () => {
  let service: FoodGradesService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [FoodGradesService],
    }).compile();

    service = module.get<FoodGradesService>(FoodGradesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
