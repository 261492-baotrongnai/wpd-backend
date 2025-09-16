import { Module } from '@nestjs/common';
import { StoreItemsService } from './store_items.service';
import { StoreItemsController } from './store_items.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { StoreItem } from './entities/store_item.entity';

@Module({
  imports: [TypeOrmModule.forFeature([StoreItem])],
  controllers: [StoreItemsController],
  providers: [StoreItemsService],
  exports: [StoreItemsService],
})
export class StoreItemsModule {}
