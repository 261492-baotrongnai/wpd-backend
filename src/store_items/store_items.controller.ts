import {
  Body,
  Controller,
  Get,
  Post,
  Request,
  UseGuards,
} from '@nestjs/common';
import { StoreItemsService } from './store_items.service';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
// import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';

@Controller('store-items')
export class StoreItemsController {
  constructor(private readonly storeItemsService: StoreItemsService) {}

  @Get()
  @UseGuards(JwtAuthGuard)
  async findAll(@Request() req: { user: { id: number } }) {
    const storeItems = await this.storeItemsService.findAll(req.user.id);
    // const storeItems = await this.storeItemsService.findAll(14); // --- IGNORE ---
    // console.log(storeItems);
    return storeItems;
  }

  @Post('buy-item')
  @UseGuards(JwtAuthGuard)
  async buyItem(
    @Request() req: { user: { internalId: string; id: number } },
    @Body() itemId: number,
  ) {
    return await this.storeItemsService.buyItem(req.user.id, itemId);
    // console.log(itemId);
    // return await this.storeItemsService.buyItem(14, itemId); // --- IGNORE ---
  }
}
