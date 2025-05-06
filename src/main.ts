import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import * as bodyParser from 'body-parser';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors({
    origin: '*',
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    allowedHeaders: 'Content-Type,Authorization',
  });

  // Use raw-body middleware for the /webhooks route
  app.use('/webhooks', bodyParser.raw({ type: 'application/json' }));

  await app.listen(process.env.PORT ?? 8000);
}
void (async () => {
  try {
    await bootstrap();
  } catch (error) {
    console.error('Error during application bootstrap:', error);
  }
})();
