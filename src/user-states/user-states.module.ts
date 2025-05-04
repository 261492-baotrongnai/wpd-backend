import { Module } from '@nestjs/common';
import { UserStatesService } from './user-states.service';
import { UserStatesController } from './user-states.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserState } from './entities/user-state.entity';

@Module({
  imports: [TypeOrmModule.forFeature([UserState])],
  controllers: [UserStatesController],
  providers: [UserStatesService],
  exports: [UserStatesService],
})
export class UserStatesModule {}
