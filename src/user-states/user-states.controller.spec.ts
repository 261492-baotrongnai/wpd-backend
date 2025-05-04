import { Test, TestingModule } from '@nestjs/testing';
import { UserStatesController } from './user-states.controller';
import { UserStatesService } from './user-states.service';

describe('UserStatesController', () => {
  let controller: UserStatesController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UserStatesController],
      providers: [UserStatesService],
    }).compile();

    controller = module.get<UserStatesController>(UserStatesController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
