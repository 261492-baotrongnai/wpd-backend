import {
  Controller,
  Post,
  Body,
  Put,
  UseGuards,
  // UseGuards,
  Request,
  Get,
  Param,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { RegisterDto } from './dto/register.dto';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { StoreItemsService } from 'src/store_items/store_items.service';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { QueueEventsRegistryService } from 'src/queue-events/queue-events.service';
import { Meal } from 'src/meals/entities/meal.entity';
// import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
// import { UpdateUserDto } from './dto/update-user.dto';

@Controller('users')
export class UsersController {
  private readonly logger = new Logger(UsersController.name);
  constructor(
    private readonly usersService: UsersService,
    private readonly storeItemsService: StoreItemsService,
    @InjectQueue('program') private readonly programsQueue: Queue,
    @InjectQueue('meal') private readonly mealsQueue: Queue,

    private readonly queueEvents: QueueEventsRegistryService,
  ) {}

  @Post('verify')
  async verifyLineIDToken(@Body('idToken') idToken: string) {
    return this.usersService.verifyLineIDToken(idToken);
  }

  @Post('register')
  async create(@Body() registerDto: RegisterDto) {
    console.log('Registering user with data:', registerDto);
    return this.usersService.create(registerDto);
  }

  @Put('update-current-frame')
  @UseGuards(JwtAuthGuard)
  async updateCurrentFrame(
    @Request() req: { user: { id: number } },
    @Body() body: { frameId: number },
  ) {
    await this.usersService.updateCurrentFrame(req.user.id, body.frameId);
    return this.storeItemsService.getUserFrames(req.user.id);
  }

  @Get('current-frame')
  @UseGuards(JwtAuthGuard)
  async getCurrentFrame(@Request() req: { user: { id: number } }) {
    const imageName = await this.usersService.getCurrentFrameImageName(
      req.user.id,
    );
    return imageName;
  }

  @UseGuards(JwtAuthGuard)
  @Get(':id')
  async getUserAndMealForAdmin(
    @Param('id') id: number,
    @Request() req: { user: { internalId: string; id: number } },
  ) {
    this.logger.log('[/meals/:id] for user: ', id);

    const check_permit = await this.programsQueue.add('check-user-permit', {
      userId: id,
      adminId: req.user.id,
    });
    const is_permit = await this.queueEvents.waitForJobResult(
      check_permit,
      this.programsQueue,
    );

    if (!is_permit) {
      this.logger.warn(`User ${id} is not permit to view by admin`);
      throw new NotFoundException(`User with id ${id} not found`);
    }

    const meal_job = await this.mealsQueue.add('get-user-all-meal', {
      userId: id,
    });
    const meal_result: Meal[] = (await this.queueEvents.waitForJobResult(
      meal_job,
      this.mealsQueue,
    )) as Meal[];

    this.logger.log(`Found ${meal_result.length} meals for user ${id}`);

    const user = await this.usersService.getUserWithLineProfile(id);
    if (!user) {
      throw new NotFoundException(`User with id ${id} not found`);
    }
    return { user, meals: meal_result };
  }
  // @UseGuards(JwtAuthGuard)
  // @Get('profile')
  // getProfile(@Request() req: { user: { internalId: string } }) {
  //   return req.user;
  // }

  // @Get()
  // findAll() {
  //   return this.usersService.findAll();
  // }

  // @Get(':id')
  // findOne(@Param('id') id: string) {
  //   return this.usersService.findOne(+id);
  // }

  // @Get('/check/:internalId')
  // findByInternalId(@Param('internalId') internalId: string) {
  //   console.log(`Finding user by internalId: ${internalId}`);
  //   return this.usersService.findUserByInternalId(internalId);
  // }

  // @Patch(':id')
  // update(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto) {
  //   return this.usersService.update(+id, updateUserDto);
  // }

  // @Delete(':id')
  // remove(@Param('id') id: string) {
  //   return this.usersService.remove(+id);
  // }

  // @Get('empty')
  // async getTodayEmptyMealUsers() {
  //   return this.usersService.getTodayEmptyMealUsers();
  // }
}
