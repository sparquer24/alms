import 'reflect-metadata';
import { config } from 'dotenv';
import { resolve } from 'path';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './modules/app.module';
import { AllExceptionsFilter } from './filters/all-exceptions.filter';
import { ErrorsInterceptor } from './interceptors/errors.interceptor';
import { LoggingInterceptor } from './interceptors/logging.interceptor';
import { Logger } from '@nestjs/common';

// Load environment variables before anything else (prefer root .env)
const rootEnvPath = resolve(__dirname, '../../.env');
config({ path: rootEnvPath });

const logger = new Logger('Bootstrap');

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger: process.env.NODE_ENV === 'production'
      ? ['error', 'warn', 'log']
      : ['error', 'warn', 'log', 'debug', 'verbose'],
  });

  // Apply global exception filter
  app.useGlobalFilters(new AllExceptionsFilter());

  // Apply global interceptors
  app.useGlobalInterceptors(new LoggingInterceptor()); // Must be first for accurate timing
  app.useGlobalInterceptors(new ErrorsInterceptor());

  // Global exception handlers to prevent crashes
  process.on('uncaughtException', (error) => {
    logger.error('Uncaught Exception:', error.stack || error);
    // Don't exit immediately - allow graceful shutdown
  });

  process.on('unhandledRejection', (reason, promise) => {
    logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
    // Don't exit - log and continue
  });

  // Graceful shutdown handlers
  process.on('SIGTERM', async () => {
    logger.log('SIGTERM signal received: closing HTTP server');
    await app.close();
    process.exit(0);
  });

  process.on('SIGINT', async () => {
    logger.log('SIGINT signal received: closing HTTP server');
    await app.close();
    process.exit(0);
  });

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
    allowedHeaders: ['Content-Type', 'Authorization', 'authorization'],
  });

  // Prefix all routes with /api so every API endpoint is under /api
  app.setGlobalPrefix('api');

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
  // Serve Swagger UI under /api/api-docs to match global API prefix
  SwaggerModule.setup('api/api-docs', app, document, {
    swaggerOptions: {
      persistAuthorization: true,
      docExpansion: 'none',
      filter: true,
      showRequestDuration: true,
    },
  });

  const port = process.env.PORT || 3000;
  await app.listen(Number(port));

  logger.log(`Backend listening on http://localhost:${port}`);
  logger.log(`Swagger API docs available at http://localhost:${port}/api/api-docs`);
  logger.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  logger.log(`Process ID: ${process.pid}`);
}

bootstrap().catch((error) => {
  logger.error('Failed to start application:', error.stack || error);
  process.exit(1);
});
