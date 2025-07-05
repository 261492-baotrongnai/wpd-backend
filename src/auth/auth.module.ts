import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { UsersModule } from 'src/users/users.module';
import { JwtModule } from '@nestjs/jwt';
// import { LocalStrategy } from './strategies/local.strategy';
import { PassportModule } from '@nestjs/passport';
import { JwtStrategy } from './strategies/jwt.strategy';
import { WebhooksService } from 'src/webhooks/webhooks.service';
import { UserStatesModule } from 'src/user-states/user-states.module';
import { RecordCaseHandler } from 'src/webhooks/record-case';
import { ImagesService } from 'src/images/images.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Image } from 'src/images/entities/image.entity';
import { ExternalApiService } from 'src/external-api/external-api.service';
import { FoodGradesService } from 'src/food-grades/food-grades.service';
import { FoodGradesModule } from 'src/food-grades/food-grades.module';
import { MealsService } from 'src/meals/meals.service';
import { MealsModule } from 'src/meals/meals.module';
import { FoodsModule } from 'src/foods/foods.module';
import { FoodsService } from 'src/foods/foods.service';
import { BullModule } from '@nestjs/bullmq';
import { WebhooksProcessor } from 'src/webhooks/workers/webhooks.worker';

@Module({
  controllers: [AuthController],
  providers: [
    AuthService,
    JwtStrategy,
    WebhooksService,
    RecordCaseHandler,
    ImagesService,
    ExternalApiService,
    FoodGradesService,
    MealsService,
    FoodsService,
    WebhooksProcessor,
  ],
  imports: [
    UsersModule,
    UserStatesModule,
    FoodGradesModule,
    MealsModule,
    FoodsModule,
    JwtModule.register({
      secret: process.env.JWT_SECRET,
      signOptions: { expiresIn: '1h' },
    }),
    PassportModule,
    TypeOrmModule.forFeature([Image]),
    BullModule.registerQueue(
      {
        name: 'webhook',
      },
      { name: 'webhook-service' },
      { name: 'admin' },
    ),
  ],
})
export class AuthModule {}
