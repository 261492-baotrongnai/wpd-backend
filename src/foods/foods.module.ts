import { Module } from '@nestjs/common';
import { FoodsService } from './foods.service';
import { FoodsController } from './foods.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Food } from './entities/food.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Food])],
  controllers: [FoodsController],
  providers: [FoodsService],
  exports: [FoodsService, TypeOrmModule],
})
export class FoodsModule {}
