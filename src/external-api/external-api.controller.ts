import { Controller } from '@nestjs/common';
import { ExternalApiService } from './external-api.service';

@Controller('external-api')
export class ExternalApiController {
  constructor(private readonly externalApiService: ExternalApiService) {}
}
