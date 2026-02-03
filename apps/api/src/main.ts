import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  // Get ConfigService to access environment variables
  const configService = app.get(ConfigService);
  
  // Enable CORS if configured
  const corsEnabled = configService.get<string>('CORS_ENABLED') === 'true';
  if (corsEnabled) {
    app.enableCors();
  }
  
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
