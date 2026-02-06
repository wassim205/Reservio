import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { ValidationPipe } from '@nestjs/common';
import cookieParser from 'cookie-parser';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Parse cookies
  app.use(cookieParser());

  // Enable global validation
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // Get ConfigService to access environment variables
  const configService = app.get(ConfigService);

  // Enable CORS for frontend
  const frontendUrl =
    configService.get<string>('FRONTEND_URL') || 'http://localhost:3000';
  app.enableCors({
    origin: frontendUrl,
    credentials: true,
  });

  // Get port from environment or default to 3001
  const port = configService.get<number>('API_PORT') || 3001;

  await app.listen(port);
  console.log(`🚀 API Server running on http://localhost:${port}`);
}

// Start the application
bootstrap().catch((error) => {
  console.error('❌ Error starting the application:', error);
  process.exit(1);
});
