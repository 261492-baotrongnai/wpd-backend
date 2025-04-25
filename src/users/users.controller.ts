import { Controller, Post, Get, Body, Param, Delete } from '@nestjs/common';
import { UsersService } from './users.service';
import { RegisterDto } from './dto/register.dto';
// import { UpdateUserDto } from './dto/update-user.dto';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post('verify')
  async verifyUser(@Body() { idToken }: { idToken: string }) {
    const user = await this.usersService.verifyLineIDToken(idToken);
    const token = await this.usersService.generateToken(user.internalId);
    return { token };
  }

  @Post('register')
  async create(@Body() registerDto: RegisterDto) {
    return this.usersService.create(registerDto);
  }

  @Get()
  findAll() {
    return this.usersService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.usersService.findOne(+id);
  }

  // @Patch(':id')
  // update(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto) {
  //   return this.usersService.update(+id, updateUserDto);
  // }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.usersService.remove(+id);
  }
}
