import { CanActivate, ExecutionContext, HttpException, HttpStatus, Injectable } from '@nestjs/common';

/**
 * Minimal in-memory, per-IP rate limiter for the unauthenticated public
 * endpoints. Not a substitute for a proper distributed limiter behind a
 * load balancer, but it stops trivial single-process enumeration/scraping
 * of the public application-lookup and dashboard endpoints.
 */
@Injectable()
export class PublicRateLimitGuard implements CanActivate {
  private static readonly WINDOW_MS = 60_000;
  private static readonly MAX_REQUESTS_PER_WINDOW = 30;
  private readonly hits = new Map<string, { count: number; windowStart: number }>();

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const ip = this.resolveIp(request);
    const now = Date.now();

    const entry = this.hits.get(ip);
    if (!entry || now - entry.windowStart > PublicRateLimitGuard.WINDOW_MS) {
      this.hits.set(ip, { count: 1, windowStart: now });
      this.sweep(now);
      return true;
    }

    entry.count += 1;
    if (entry.count > PublicRateLimitGuard.MAX_REQUESTS_PER_WINDOW) {
      throw new HttpException(
        { success: false, error: 'Too many requests. Please try again in a minute.' },
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    return true;
  }

  private resolveIp(request: any): string {
    const forwarded = request?.headers?.['x-forwarded-for'];
    if (typeof forwarded === 'string' && forwarded.length > 0) {
      return forwarded.split(',')[0].trim();
    }
    return request?.ip || request?.connection?.remoteAddress || 'unknown';
  }

  /** Bound the map's growth by dropping stale entries opportunistically. */
  private sweep(now: number) {
    if (this.hits.size < 5000) return;
    for (const [ip, entry] of this.hits) {
      if (now - entry.windowStart > PublicRateLimitGuard.WINDOW_MS) {
        this.hits.delete(ip);
      }
    }
  }
}
