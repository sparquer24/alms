import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Internal server error';
    let error = 'Error';

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse();
      
      if (typeof exceptionResponse === 'string') {
        message = exceptionResponse;
      } else if (typeof exceptionResponse === 'object' && exceptionResponse !== null) {
        message = (exceptionResponse as any).message || message;
        error = (exceptionResponse as any).error || error;
      }
    } else if (exception instanceof Error) {
      message = exception.message;
      error = exception.name;
      
      // Log stack trace for non-HTTP exceptions
      this.logger.error(
        `${request.method} ${request.url} - ${exception.message}`,
        exception.stack,
      );
    } else {
      this.logger.error(
        `${request.method} ${request.url} - Unknown exception`,
        JSON.stringify(exception),
      );
    }

    // Prepare error response
    const errorResponse = {
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      method: request.method,
      error,
      message,
    };

    // Log the error (except for 4xx client errors)
    if (status >= 500) {
      this.logger.error(
        `HTTP ${status} Error Response: ${JSON.stringify(errorResponse)}`,
      );
    } else if (status >= 400) {
      this.logger.warn(
        `HTTP ${status} Client Error: ${request.method} ${request.url} - ${message}`,
      );
    }

    // Send response
    response.status(status).json(errorResponse);
  }
}
