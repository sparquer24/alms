import { config } from 'dotenv';
import { resolve } from 'path';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './modules/app.module';

// Load environment variables before anything else (prefer root .env)
const rootEnvPath = resolve(__dirname, '../../.env');
config({ path: rootEnvPath });
// Fallback to default if root .env not found
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

  // Setup Swagger Documentation
  const swaggerConfig = new DocumentBuilder()
    .setTitle('ALMS API Documentation')
    .setDescription('Arms License Management System - Complete API Documentation')
    .setVersion('1.0')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'JWT',
        description: 'Enter JWT token',
        in: 'header',
      },
      'JWT-auth',
    )
    .addTag('Authentication', 'User authentication and authorization endpoints')
    .addTag('Users', 'User management endpoints')
    .addTag('Locations', 'Geographic location management endpoints')
    .addTag('Application Form', 'Fresh license application form endpoints')
    .addTag('Workflow', 'Application workflow and processing endpoints')
    .build();

  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('api-docs', app, document, {
    swaggerOptions: {
      persistAuthorization: true,
      docExpansion: 'none',
      filter: true,
      showRequestDuration: true,
    },
  });
  
  const port = parseInt(process.env.PORT || '3000', 10);
  const host = process.env.HOST || 'localhost';
  await app.listen(port);
  console.log(`Application is running on: http://${host}:${port}`);
  console.log(`Swagger API Documentation available at: http://${host}:${port}/api-docs`);
}

bootstrap();
