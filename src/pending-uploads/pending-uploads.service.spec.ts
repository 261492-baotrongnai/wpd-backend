import { Test, TestingModule } from '@nestjs/testing';
import { PendingUploadsService } from './pending-uploads.service';

describe('PendingUploadsService', () => {
  let service: PendingUploadsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PendingUploadsService],
    }).compile();

    service = module.get<PendingUploadsService>(PendingUploadsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
