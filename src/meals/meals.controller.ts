import { Controller, Get, Post, Body, Param, Delete } from '@nestjs/common';
import { MealsService } from './meals.service';
import { CreateMealDto } from './dto/create-meal.dto';
// import { UpdateMealDto } from './dto/update-meal.dto';

@Controller('meals')
export class MealsController {
  constructor(private readonly mealsService: MealsService) {}

  @Post()
  create(@Body() createMealDto: CreateMealDto) {
    return this.mealsService.create(createMealDto);
  }

  @Get()
  findAll() {
    return this.mealsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.mealsService.findOne(+id);
  }

  @Get('user/:userId')
  findAllByUser(@Param('userId') userId: string) {
    return this.mealsService.findAllByUser(+userId);
  }

  // @Patch(':id')
  // update(@Param('id') id: string, @Body() updateMealDto: UpdateMealDto) {
  //   return this.mealsService.update(+id, updateMealDto);
  // }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.mealsService.remove(+id);
  }
}
