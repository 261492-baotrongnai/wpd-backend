import { Test, TestingModule } from '@nestjs/testing';
import { PendingUploadsController } from './pending-uploads.controller';
import { PendingUploadsService } from './pending-uploads.service';

describe('PendingUploadsController', () => {
  let controller: PendingUploadsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PendingUploadsController],
      providers: [PendingUploadsService],
    }).compile();

    controller = module.get<PendingUploadsController>(PendingUploadsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
