import {
  Body,
  Controller,
  Get,
  Logger,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { FoodsService } from './foods.service';
import { QueueEventsRegistryService } from 'src/queue-events/queue-events.service';
import { InjectQueue } from '@nestjs/bullmq';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { Queue } from 'bullmq';
import { EditFoodDto } from './dto/edit-food.dto';

@Controller('food')
export class FoodsController {
  private readonly logger = new Logger(FoodsController.name);
  constructor(
    private readonly foodsService: FoodsService,
    private readonly queueEventsRegistryService: QueueEventsRegistryService,
    @InjectQueue('food') private readonly foodQueue: Queue,
    @InjectQueue('food-grade') private readonly foodGradeQueue: Queue,
  ) {}

  @Get('waiting-confirmation')
  @UseGuards(JwtAuthGuard)
  async confirmPending(
    @Req() req: { user: { internalId: string; id: number } },
  ) {
    const job = await this.foodQueue.add('get-waiting-confirmation', {
      userId: req.user.id,
    });
    const result = await this.queueEventsRegistryService.waitForJobResult(
      job,
      this.foodQueue,
    );
    return result;
  }

  @Get('is-editor')
  @UseGuards(JwtAuthGuard)
  async isEditor(@Req() req: { user: { internalId: string; id: number } }) {
    const job = await this.foodQueue.add('check-editor-status', {
      userId: req.user.id,
    });
    const result = await this.queueEventsRegistryService.waitForJobResult(
      job,
      this.foodQueue,
    );
    return result;
  }

  @Post('edit')
  @UseGuards(JwtAuthGuard)
  async edit(@Body() editFoodDto: EditFoodDto) {
    this.logger.log('Editing food...');
    const editJob = await this.foodQueue.add('edit-food', {
      foodData: editFoodDto,
    });
    this.logger.log(`Job ${editJob.id} added to the queue for editing food`);
    const result = await this.queueEventsRegistryService.waitForJobResult(
      editJob,
      this.foodQueue,
    );
    this.logger.log(`Job ${editJob.id} completed with result:`, result);

    if (editFoodDto.is_confirmed) {
      this.logger.log('Food confirmed, adding to food-grade queue...');
      this.logger.log('Adding job to food-grade queue...');
      const addJob = await this.foodGradeQueue.add('create-food-grade', {
        foodData: { ...editFoodDto, addedFromUser: true },
      });
      this.logger.log(
        `Job ${addJob.id} added to the queue for creating food grade`,
      );
      const gradeResult =
        await this.queueEventsRegistryService.waitForJobResult(
          addJob,
          this.foodGradeQueue,
        );
      this.logger.log(`Job ${addJob.id} completed with result:`, gradeResult);
    }
    return result;
  }
}
