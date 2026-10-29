import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

/**
 * Apply DB_POOL_SIZE as Prisma's connection_limit, unless DATABASE_URL already sets one.
 * Without either, Prisma sizes the pool from the host's CPU count.
 */
export function withPoolSize(url: string | undefined, poolSize = process.env.DB_POOL_SIZE): string | undefined {
  const size = Number(poolSize);
  if (!url || !Number.isInteger(size) || size < 1 || /[?&]connection_limit=/.test(url)) return url;
  return `${url}${url.includes('?') ? '&' : '?'}connection_limit=${size}`;
}

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name);

  constructor() {
    super({
      // Query logging is expensive and very noisy; opt in with PRISMA_LOG_QUERIES=true
      log: process.env.PRISMA_LOG_QUERIES === 'true'
        ? ['query', 'error', 'warn']
        : ['error', 'warn'],
      errorFormat: 'pretty',
      datasources: {
        db: {
          url: withPoolSize(process.env.DATABASE_URL),
        },
      },
    });
  }

  async onModuleInit() {
    try {
      await this.$connect();
      this.logger.log('Database connected successfully');
      
      // Set up query optimization
      await this.$executeRaw`SET statement_timeout = '30000'`; // 30 second timeout
      
    } catch (error) {
      this.logger.error('Failed to connect to database', error);
      throw error;
    }
  }

  async onModuleDestroy() {
    this.logger.log('Disconnecting from database...');
    await this.$disconnect();
  }

  // Helper method for health checks
  async isHealthy(): Promise<boolean> {
    try {
      await this.$queryRaw`SELECT 1`;
      return true;
    } catch (error) {
      this.logger.error('Database health check failed', error);
      return false;
    }
  }

  // Clean up connections on errors
  async enableShutdownHooks() {
    process.on('beforeExit', async () => {
      await this.$disconnect();
    });
  }
}
