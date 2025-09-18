import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Logger,
  Post,
  Put,
  Req,
  UnauthorizedException,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FoodGradesService } from './food-grades.service';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { QueueEventsRegistryService } from 'src/queue-events/queue-events.service';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { UpdateFoodGradeDto } from './dto/update-food-grade.dto';
import { ExternalApiService } from 'src/external-api/external-api.service';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
// import { UpdateFoodGradeDto } from './dto/update-food-grade.dto';

@Controller('food-grade')
export class FoodGradesController {
  private readonly logger = new Logger(FoodGradesController.name);
  constructor(
    private readonly foodGradesService: FoodGradesService,
    private readonly queueEventsRegistryService: QueueEventsRegistryService,
    private readonly externalApiService: ExternalApiService,
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

  @Post('test')
  @UseInterceptors(
    FileInterceptor('image', {
      storage: memoryStorage(),
      limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
      fileFilter: (_req, file, cb) => {
        if (file.mimetype?.startsWith('image/')) return cb(null, true);
        cb(
          new BadRequestException('Invalid file type. Only images are allowed'),
          false,
        );
      },
    }),
  )
  async uploadImage(
    @UploadedFile() file: Express.Multer.File,
    @Body() body: { name: string },
  ) {
    if (!file) {
      throw new BadRequestException('No file uploaded. Expect field "image"');
    }
    if (!file.mimetype?.startsWith('image/')) {
      throw new BadRequestException(
        'Invalid file type. Only images are allowed',
      );
    }
    // Upload image to Gemini to get a file URI
    const uploaded = await this.externalApiService.uploadImageToGemini({
      buffer: file.buffer,
      mimeType: file.mimetype,
    });
    if (!uploaded.uri || !uploaded.mimeType) {
      throw new BadRequestException('Failed to upload image to Gemini');
    }

    const response = await this.externalApiService.geminiExtractFoodData(
      body.name,
      {
        uri: uploaded.uri,
        mimeType: uploaded.mimeType,
      },
    );

    const result = this.foodGradesService.ruleBasedGrading(response);
    return result;
  }
}
