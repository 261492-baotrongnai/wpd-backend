import { Module } from '@nestjs/common';
import { PendingUploadsService } from './pending-uploads.service';
import { PendingUploadsController } from './pending-uploads.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PendingUpload } from './entities/pending-uploads.entity';

@Module({
  imports: [TypeOrmModule.forFeature([PendingUpload])],
  controllers: [PendingUploadsController],
  providers: [PendingUploadsService],
  exports: [PendingUploadsService],
})
export class PendingUploadsModule {}
