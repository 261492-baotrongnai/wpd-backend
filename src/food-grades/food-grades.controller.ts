import { Controller, Get, Logger, Req, UseGuards } from '@nestjs/common';
import { FoodGradesService } from './food-grades.service';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { QueueEventsRegistryService } from 'src/queue-events/queue-events.service';
// import { UpdateFoodGradeDto } from './dto/update-food-grade.dto';

@Controller('food-grades')
export class FoodGradesController {
  private readonly logger = new Logger(FoodGradesController.name);
  constructor(
    private readonly foodGradesService: FoodGradesService,
    private readonly queueEventsRegistryService: QueueEventsRegistryService,
  ) {}

  @Get()
  @UseGuards(JwtAuthGuard)
  async findAll(@Req() req: { user: { internalId: string; id: number } }) {
    this.logger.log(
      'checking is this admin has permission to access as editor...',
    );
    

    return this.foodGradesService.findAll();
  }
}
