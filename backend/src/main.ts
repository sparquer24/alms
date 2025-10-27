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
  // Increase body size limit to 10MB for JSON and URL-encoded requests
  const express = require('express');
  app.use(express.json({ limit: '2mb' }));
  app.use(express.urlencoded({ limit: '2mb', extended: true }));
  
  // Enable CORS for frontend. Read from CORS_ORIGIN env (comma-separated) else fallback to sensible defaults.
  const defaultOrigins = ['http://localhost:5000', 'http://localhost:3001', 'http://localhost:3000', 'http://127.0.0.1:5000', 'http://127.0.0.1:3001', 'http://127.0.0.1:3000'];
  const corsEnv = process.env.CORS_ORIGIN;
  const origins = corsEnv ? corsEnv.split(',').map(s => s.trim()).filter(Boolean) : defaultOrigins;

  app.enableCors({
    origin: origins,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
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

  await app.listen(3000);
}

bootstrap();
