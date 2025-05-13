import { Controller, Get, Param, Post, Body } from '@nestjs/common';
import { FoodGradesService } from './food-grades.service';
import { CreateFoodGradeDto } from './dto/create-food-grade.dto';
// import { UpdateFoodGradeDto } from './dto/update-food-grade.dto';

@Controller('food-grades')
export class FoodGradesController {
  constructor(private readonly foodGradesService: FoodGradesService) {}

  // @Post()
  // create(@Body() createFoodGradeDto: CreateFoodGradeDto) {
  //   return this.foodGradesService.create(createFoodGradeDto);
  // }

  @Post('create')
  create(@Body() createFoodGradeDto: CreateFoodGradeDto) {
    return this.foodGradesService.create(createFoodGradeDto);
  }

  @Get()
  findAll() {
    return this.foodGradesService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.foodGradesService.findOne(+id);
  }

  @Post('get-menu-grade')
  getMenuGrade(@Body('menus') menus: string[]) {
    return this.foodGradesService.getMenuGrade(menus);
  }
}
