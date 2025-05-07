import { Controller } from '@nestjs/common';
import { PendingUploadsService } from './pending-uploads.service';

@Controller('pending-uploads')
export class PendingUploadsController {
  constructor(private readonly pendingUploadsService: PendingUploadsService) {}
}
