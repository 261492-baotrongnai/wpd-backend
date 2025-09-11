import {
  Body,
  Controller,
  Delete,
  Get,
  Logger,
  Put,
  Req,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { FoodGradesService } from './food-grades.service';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { QueueEventsRegistryService } from 'src/queue-events/queue-events.service';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { UpdateFoodGradeDto } from './dto/update-food-grade.dto';
// import { UpdateFoodGradeDto } from './dto/update-food-grade.dto';

@Controller('food-grade')
export class FoodGradesController {
  private readonly logger = new Logger(FoodGradesController.name);
  constructor(
    private readonly foodGradesService: FoodGradesService,
    private readonly queueEventsRegistryService: QueueEventsRegistryService,
    @InjectQueue('food-grade') private foodGradeQueue: Queue,
  ) {}

  @Get()
  @UseGuards(JwtAuthGuard)
  async findAll(
    @Req() req: { user: { internalId: string; id: number; role: string } },
  ) {
    if (req.user.role !== 'admin') {
      this.logger.warn(
        `User with ID ${req.user.id} and role ${req.user.role} attempted to access all food grades.`,
      );
      throw new UnauthorizedException('Access denied');
    }
    const job = await this.foodGradeQueue.add('get-all-food-grade', {});
    const result = await this.queueEventsRegistryService.waitForJobResult(
      job,
      this.foodGradeQueue,
    );
    return result;
  }

  @Put()
  @UseGuards(JwtAuthGuard)
  async update(
    @Req() req: { user: { internalId: string; id: number; role: string } },
    @Body() body: { menu: UpdateFoodGradeDto },
  ) {
    if (req.user.role !== 'admin') {
      this.logger.warn(
        `User with ID ${req.user.id} and role ${req.user.role} attempted to update food grades.`,
      );
      throw new UnauthorizedException('Access denied');
    }
    // this.logger.log('Updating food grade with: ' + JSON.stringify(body));
    const job = await this.foodGradeQueue.add('update-food-grade', body);
    const result = await this.queueEventsRegistryService.waitForJobResult(
      job,
      this.foodGradeQueue,
    );
    return result;
  }

  @Delete()
  @UseGuards(JwtAuthGuard)
  async remove(
    @Req() req: { user: { internalId: string; id: number; role: string } },
    @Body() body: { ids: number[] },
  ) {
    if (req.user.role !== 'admin') {
      this.logger.warn(
        `User with ID ${req.user.id} and role ${req.user.role} attempted to remove food grades.`,
      );
      throw new UnauthorizedException('Access denied');
    }
    const job = await this.foodGradeQueue.add('remove-food-grade', body);
    const result = await this.queueEventsRegistryService.waitForJobResult(
      job,
      this.foodGradeQueue,
    );
    return result;
  }
}
