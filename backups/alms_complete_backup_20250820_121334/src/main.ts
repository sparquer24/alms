import { config } from 'dotenv';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './modules/app.module';

// Load environment variables before anything else
config();

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  // Enable CORS for frontend
  app.enableCors({
    origin: ['http://localhost:5000', 'http://localhost:3001', 'http://localhost:3000', 'http://127.0.0.1:5000', 'http://127.0.0.1:3001', 'http://127.0.0.1:3000'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });
  
  await app.listen(3000);
  console.log(`Application is running on: http://localhost:3000`);
  console.log(`CORS enabled for frontend ports`);
}

bootstrap();
