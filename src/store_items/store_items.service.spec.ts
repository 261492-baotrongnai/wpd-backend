import { Test, TestingModule } from '@nestjs/testing';
import { StoreItemsService } from './store_items.service';

describe('StoreItemsService', () => {
  let service: StoreItemsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [StoreItemsService],
    }).compile();

    service = module.get<StoreItemsService>(StoreItemsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
