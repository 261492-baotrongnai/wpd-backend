import {
  Controller,
  Post,
  Body,
  Put,
  UseGuards,
  // UseGuards,
  Request,
  Get,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { RegisterDto } from './dto/register.dto';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { StoreItemsService } from 'src/store_items/store_items.service';
// import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
// import { UpdateUserDto } from './dto/update-user.dto';

@Controller('users')
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
    private readonly storeItemsService: StoreItemsService,
  ) {}

  @Post('verify')
  async verifyLineIDToken(@Body('idToken') idToken: string) {
    return this.usersService.verifyLineIDToken(idToken);
  }

  @Post('register')
  async create(@Body() registerDto: RegisterDto) {
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
