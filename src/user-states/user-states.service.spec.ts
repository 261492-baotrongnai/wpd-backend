import { Test, TestingModule } from '@nestjs/testing';
import { UserStatesService } from './user-states.service';

describe('UserStatesService', () => {
  let service: UserStatesService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [UserStatesService],
    }).compile();

    service = module.get<UserStatesService>(UserStatesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
