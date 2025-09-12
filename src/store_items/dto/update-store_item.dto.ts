import { PartialType } from '@nestjs/mapped-types';
import { CreateStoreItemDto } from './create-store_item.dto';

export class UpdateStoreItemDto extends PartialType(CreateStoreItemDto) {}
