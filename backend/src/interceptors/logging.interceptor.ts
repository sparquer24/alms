import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { Request, Response } from 'express';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger('HTTP');

  // ANSI color codes
  private readonly colors = {
    reset: '\x1b[0m',
    green: '\x1b[32m',
    blue: '\x1b[34m',
    cyan: '\x1b[36m',
    yellow: '\x1b[33m',
    red: '\x1b[31m',
    magenta: '\x1b[35m',
    gray: '\x1b[90m',
  };

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest<Request>();
    const response = context.switchToHttp().getResponse<Response>();
    
    const { method, url, body, query, params, headers } = request;
    const userAgent = headers['user-agent'] || 'unknown';
    const ip = headers['x-forwarded-for'] || request.ip || 'unknown';
    
    const startTime = Date.now();
    const timestamp = new Date().toISOString();

    // Log incoming request with colors
    const methodColor = this.getMethodColor(method);
    this.logger.log(
      `${this.colors.cyan}➡️  ${this.colors.gray}[${timestamp}]${this.colors.reset} ${methodColor}${method}${this.colors.reset} ${this.colors.blue}${url}${this.colors.reset} ${this.colors.gray}- IP: ${ip}${this.colors.reset}`
    );

    // Log query params if present
    if (Object.keys(query).length > 0) {
      this.logger.debug(`${this.colors.magenta}   Query:${this.colors.reset} ${JSON.stringify(query)}`);
    }

    // Log body payload if present (exclude sensitive fields)
    if (body && Object.keys(body).length > 0) {
      const sanitizedBody = this.sanitizeBody(body);
      this.logger.debug(`${this.colors.magenta}   Body:${this.colors.reset} ${JSON.stringify(sanitizedBody)}`);
    }

    // Log route params if present
    if (params && Object.keys(params).length > 0) {
      this.logger.debug(`${this.colors.magenta}   Params:${this.colors.reset} ${JSON.stringify(params)}`);
    }

    return next.handle().pipe(
      tap({
        next: (data) => {
          const endTime = Date.now();
          const duration = endTime - startTime;
          const statusCode = response.statusCode;
          const statusColor = this.getStatusColor(statusCode);
          const durationColor = this.getDurationColor(duration);
          
          this.logger.log(
            `${this.colors.green}⬅️  ${this.colors.gray}[${new Date().toISOString()}]${this.colors.reset} ${this.getMethodColor(method)}${method}${this.colors.reset} ${this.colors.blue}${url}${this.colors.reset} ${statusColor}${statusCode}${this.colors.reset} ${durationColor}${duration}ms${this.colors.reset}`
          );
        },
        error: (error) => {
          const endTime = Date.now();
          const duration = endTime - startTime;
          const statusCode = error.status || 500;
          const statusColor = this.getStatusColor(statusCode);
          
          this.logger.error(
            `${this.colors.red}❌ ${this.colors.gray}[${new Date().toISOString()}]${this.colors.reset} ${this.getMethodColor(method)}${method}${this.colors.reset} ${this.colors.blue}${url}${this.colors.reset} ${statusColor}${statusCode}${this.colors.reset} ${this.colors.gray}${duration}ms${this.colors.reset} ${this.colors.red}- Error: ${error.message}${this.colors.reset}`
          );
        },
      })
    );
  }

  private sanitizeBody(body: any): any {
    const sensitiveFields = ['password', 'token', 'secret', 'apiKey', 'authorization'];
    const sanitized = { ...body };

    for (const field of sensitiveFields) {
      if (sanitized[field]) {
        sanitized[field] = '***REDACTED***';
      }
    }

    return sanitized;
  }

  private getMethodColor(method: string): string {
    switch (method) {
      case 'GET':
        return this.colors.cyan;
      case 'POST':
        return this.colors.green;
      case 'PUT':
      case 'PATCH':
        return this.colors.yellow;
      case 'DELETE':
        return this.colors.red;
      default:
        return this.colors.reset;
    }
  }

  private getStatusColor(statusCode: number): string {
    if (statusCode >= 500) {
      return this.colors.red; // Server errors - RED
    } else if (statusCode >= 400) {
      return this.colors.yellow; // Client errors - YELLOW
    } else if (statusCode >= 300) {
      return this.colors.cyan; // Redirects - CYAN
    } else if (statusCode >= 200) {
      return this.colors.green; // Success - GREEN
    }
    return this.colors.reset;
  }

  private getDurationColor(duration: number): string {
    if (duration > 1000) {
      return this.colors.red; // Slow (>1s) - RED
    } else if (duration > 500) {
      return this.colors.yellow; // Medium (>500ms) - YELLOW
    }
    return this.colors.green; // Fast (<500ms) - GREEN
  }
}
