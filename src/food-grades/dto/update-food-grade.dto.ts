import { PartialType } from '@nestjs/mapped-types';
import { CreateFoodGradeDto } from './create-food-grade.dto';

export class UpdateFoodGradeDto extends PartialType(CreateFoodGradeDto) {}
