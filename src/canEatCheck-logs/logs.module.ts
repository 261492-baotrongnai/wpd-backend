import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { userDecideQueueService } from './logs.service';
import { userDecideQueueController } from './logs.controller'

@Module({
  imports: [
    BullModule.registerQueue({
      name: 'canEatCheck-user-decide',
    }),
  ],
  controllers: [userDecideQueueController],
  providers: [userDecideQueueService],
  exports: [userDecideQueueService],
})
export class userDecideQueueModule {}
