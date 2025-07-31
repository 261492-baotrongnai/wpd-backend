import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { ChoiceLogsService } from './logs.service';
import { ChoiceLogsController } from './logs.controller';

@Module({
  imports: [
    BullModule.registerQueue({
      name: 'user-choice-logs',
    }),
  ],
  controllers: [ChoiceLogsController],
  providers: [ChoiceLogsService],
  exports: [ChoiceLogsService],
})
export class ChoiceLogsModule {}
