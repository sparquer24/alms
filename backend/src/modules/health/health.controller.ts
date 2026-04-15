import { Controller, Get, HttpStatus, HttpException } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Controller('health')
export class HealthController {
  private prisma = new PrismaClient();

  @Get()
  async check() {
    try {
      // Check database connectivity with timeout
      await Promise.race([
        this.prisma.$queryRaw`SELECT 1`,
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Database timeout')), 5000)
        )
      ]);

      const memory = process.memoryUsage();
      const uptime = process.uptime();

      return {
        status: 'ok',
        timestamp: new Date().toISOString(),
        uptime: Math.floor(uptime),
        uptimeFormatted: `${Math.floor(uptime / 3600)}h ${Math.floor((uptime % 3600) / 60)}m`,
        database: 'connected',
        memory: {
          heapUsed: `${Math.round(memory.heapUsed / 1024 / 1024)}MB`,
          heapTotal: `${Math.round(memory.heapTotal / 1024 / 1024)}MB`,
          rss: `${Math.round(memory.rss / 1024 / 1024)}MB`,
          external: `${Math.round(memory.external / 1024 / 1024)}MB`,
        },
        pid: process.pid,
        nodeVersion: process.version,
        environment: process.env.NODE_ENV || 'development',
        port: process.env.PORT || 3000,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';

      // Still return 200-OK during startup even if database is not ready
      // This prevents health check failures during startup
      if (process.uptime() < 60) { // First 60 seconds
        return {
          status: 'starting',
          timestamp: new Date().toISOString(),
          uptime: Math.floor(process.uptime()),
          database: 'initializing',
          error: errorMessage,
          pid: process.pid,
          port: process.env.PORT || 3000,
        };
      }

      throw new HttpException(
        {
          status: 'error',
          timestamp: new Date().toISOString(),
          database: 'disconnected',
          error: errorMessage,
          pid: process.pid,
          port: process.env.PORT || 3000,
        },
        HttpStatus.SERVICE_UNAVAILABLE,
      );
    }
  }

  @Get('ready')
  async ready() {
    // Simple readiness check that doesn't depend on database
    return {
      status: 'ready',
      timestamp: new Date().toISOString(),
      uptime: Math.floor(process.uptime()),
      pid: process.pid,
      port: process.env.PORT || 3000,
    };
  }
}
