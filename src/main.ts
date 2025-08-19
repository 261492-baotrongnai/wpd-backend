import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import * as bodyParser from 'body-parser';
import * as moment from 'moment-timezone';
import { ConfigService } from '@nestjs/config'; // Import the 'ConfigService' from '@nestjs/config'
import { NestExpressApplication } from '@nestjs/platform-express';
import * as path from 'path';

async function bootstrap() {
  moment.tz.setDefault('Asia/Bangkok'); // Set the default timezone to 'Asia/Bangkok'
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  const configService = app.get(ConfigService);
  app.enableCors({
    origin: [
      configService.get<string>('FRONTEND_URL') ?? '',
      configService.get<string>('ADMIN_URL') ?? '',
    ],
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    allowedHeaders: 'Content-Type,Authorization,x-short-token',
  });

  // Use raw-body middleware for the /webhooks route
  app.use('/webhooks', bodyParser.raw({ type: 'application/json' }));

  // Serve static files from /uploads
  app.useStaticAssets(path.join(__dirname, '..', 'uploads'), {
    prefix: '/uploads/',
  });

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
