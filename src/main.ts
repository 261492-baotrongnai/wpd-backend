import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import * as bodyParser from 'body-parser';
import * as moment from 'moment-timezone';
import { ConfigService } from '@nestjs/config'; // Import the 'ConfigService' from '@nestjs/config'

async function bootstrap() {
  moment.tz.setDefault('Asia/Bangkok'); // Set the default timezone to 'Asia/Bangkok'
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);
  app.enableCors({
    origin: [configService.get<string>('FRONTEND_URL')],
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    allowedHeaders: 'Content-Type,Authorization',
  });

  // Use raw-body middleware for the /webhooks route
  app.use('/webhooks', bodyParser.raw({ type: 'application/json' }));

  await app.listen(process.env.PORT ?? 8000, '0.0.0.0');
  console.log(`Application is running on: ${await app.getUrl()}`);
}
void (async () => {
  try {
    await bootstrap();
  } catch (error) {
    console.error('Error during application bootstrap:', error);
  }
})();
