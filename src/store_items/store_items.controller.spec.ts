import { Test, TestingModule } from '@nestjs/testing';
import { StoreItemsController } from './store_items.controller';
import { StoreItemsService } from './store_items.service';

describe('StoreItemsController', () => {
  let controller: StoreItemsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [StoreItemsController],
      providers: [StoreItemsService],
    }).compile();

    controller = module.get<StoreItemsController>(StoreItemsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
