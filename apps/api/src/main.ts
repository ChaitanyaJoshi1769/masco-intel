import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { helmet } from 'helmet';
import { AppModule } from './app.module';
import { AllExceptionsFilter } from './errors/exception.filter';
import { RateLimitMiddleware } from './middleware/rate-limit.middleware';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Security
  app.use(helmet());

  // CORS
  const corsOrigins = (process.env.CORS_ORIGINS || 'http://localhost:3000,http://localhost:5173,chrome-extension://*').split(',');
  app.enableCors({
    origin: corsOrigins,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });

  // Rate limiting
  app.use(new RateLimitMiddleware().use.bind(new RateLimitMiddleware()));

  // Global validation
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    })
  );

  // Global error filter
  app.useGlobalFilters(new AllExceptionsFilter());

  const port = process.env.PORT || 3001;
  await app.listen(port);

  const env = process.env.NODE_ENV || 'development';
  console.log(`✓ Masco Intel API (${env}) running on http://localhost:${port}`);
}

bootstrap().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
