import { Injectable, NestInterceptor, ExecutionContext, CallHandler, Logger } from '@nestjs/common';
import { Observable, throwError, TimeoutError } from 'rxjs';
import { catchError, timeout } from 'rxjs/operators';

@Injectable()
export class ErrorsInterceptor implements NestInterceptor {
  private readonly logger = new Logger(ErrorsInterceptor.name);

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    
    return next.handle().pipe(
      // Add timeout to prevent hanging requests
      timeout(60000), // 60 second timeout
      catchError(err => {
        if (err instanceof TimeoutError) {
          this.logger.error(
            `Request timeout: ${request.method} ${request.url}`,
          );
        } else {
          this.logger.error(
            `Error in interceptor: ${request.method} ${request.url}`,
            err.stack,
          );
        }
        return throwError(() => err);
      }),
    );
  }
}
