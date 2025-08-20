import { Module } from '@nestjs/common';
import { FoodsService } from './foods.service';
import { FoodsController } from './foods.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Food } from './entities/food.entity';
import { BullModule } from '@nestjs/bullmq';
import { QueueEventsRegistryService } from 'src/queue-events/queue-events.service';
import { FoodsProcessor } from './foods.worker';

@Module({
  imports: [
    TypeOrmModule.forFeature([Food]),
    BullModule.registerQueue(
      {
        name: 'food',
      },
      {
        name: 'meal',
      },
    ),
  ],
  controllers: [FoodsController],
  providers: [FoodsService, QueueEventsRegistryService, FoodsProcessor],
  exports: [FoodsService, TypeOrmModule],
})
export class FoodsModule {}
