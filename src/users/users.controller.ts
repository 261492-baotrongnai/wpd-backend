import {
  Controller,
  Post,
  Body,
  // UseGuards,
  // Request,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { RegisterDto } from './dto/register.dto';
// import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
// import { UpdateUserDto } from './dto/update-user.dto';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post('verify')
  async verifyLineIDToken(@Body('idToken') idToken: string) {
    return this.usersService.verifyLineIDToken(idToken);
  }

  @Post('register')
  async create(@Body() registerDto: RegisterDto) {
    return this.usersService.create(registerDto);
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
}
