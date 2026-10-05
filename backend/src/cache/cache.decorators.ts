import {
  applyDecorators,
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
  SetMetadata,
  UseInterceptors,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { from, Observable, of } from 'rxjs';
import { mergeMap } from 'rxjs/operators';
import * as jwt from 'jsonwebtoken';
import cache from './cache';

const CACHE_RESPONSE_KEY = 'cache:response';
const CACHE_INVALIDATE_KEY = 'cache:invalidate';

/**
 * What, besides the URL, a response depends on - and so what goes into its cache key.
 * - global:       same for every caller (reference data)
 * - role:         varies by the caller's role code
 * - jurisdiction: varies by role + state/district/zone (dashboards, analytics)
 * - user:         jurisdiction + the caller's user id and role id
 */
export type CacheScope = 'global' | 'role' | 'jurisdiction' | 'user';

interface CacheResponseOptions {
  prefix: string;
  ttlSeconds: number;
  scope: CacheScope;
}

/**
 * The caller as the controllers see it: req.user when a guard ran, otherwise the
 * verified bearer token (the unguarded license/public endpoints decode it themselves,
 * with the same claim names). Returns null for anonymous or invalid tokens - which
 * those endpoints also treat as "no user".
 */
function viewerOf(request: any): Record<string, any> | null {
  if (request.user) return request.user;
  const header = request.headers?.authorization;
  const secret = process.env.JWT_SECRET;
  if (typeof header !== 'string' || !header.startsWith('Bearer ') || !secret) return null;
  try {
    const d = jwt.verify(header.slice(7).trim(), secret) as any;
    return {
      roleCode: d?.role_code || (typeof d?.role === 'string' ? d.role : d?.role?.code),
      stateId: d?.state_id ?? d?.stateId,
      districtId: d?.district_id ?? d?.districtId,
      zoneId: d?.zone_id ?? d?.zoneId,
      userId: d?.user_id ?? d?.sub,
      roleId: d?.role_id,
    };
  } catch {
    return null;
  }
}

export function scopeKey(scope: CacheScope, request: any): string {
  if (scope === 'global') return 'all';
  const v = viewerOf(request);
  if (!v) return 'anon';
  const s = (x: unknown) => (x === undefined || x === null ? '' : String(x));
  const role = `r=${s(v.roleCode)}`;
  if (scope === 'role') return role;
  const jurisdiction = `${role}|s=${s(v.stateId)}|d=${s(v.districtId)}|z=${s(v.zoneId)}`;
  if (scope === 'jurisdiction') return jurisdiction;
  return `${jurisdiction}|u=${s(v.userId ?? v.user_id ?? v.sub)}|ri=${s(v.roleId)}`;
}

/** A handler result that reports failure in its body instead of throwing - never cache it. */
function isFailureBody(body: any): boolean {
  return body && typeof body === 'object' && (body.success === false || body.error === true);
}

@Injectable()
export class HttpCacheInterceptor implements NestInterceptor {
  constructor(private readonly reflector: Reflector) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const handler = context.getHandler();
    const request = context.switchToHttp().getRequest();
    const readOpts = this.reflector.get<CacheResponseOptions>(CACHE_RESPONSE_KEY, handler);
    const invalidate = this.reflector.get<string[]>(CACHE_INVALIDATE_KEY, handler);

    if (readOpts && request.method === 'GET') {
      // originalUrl includes the query string, so different filters get different entries
      const key = `${readOpts.prefix}${scopeKey(readOpts.scope, request)}|${request.originalUrl || request.url}`;
      return from(cache.get(key)).pipe(
        mergeMap((hit) => {
          if (hit !== undefined) return of(hit);
          return next.handle().pipe(
            mergeMap(async (body) => {
              if (!isFailureBody(body)) await cache.set(key, body, readOpts.ttlSeconds);
              return body;
            }),
          );
        }),
      );
    }

    if (invalidate?.length) {
      return next.handle().pipe(
        mergeMap(async (body) => {
          await cache.delPrefix(...invalidate);
          return body;
        }),
      );
    }

    return next.handle();
  }
}

/**
 * Cache a GET handler's response body under `prefix + caller scope + request URL`.
 * Pick the narrowest `scope` covering everything the handler reads from the caller.
 */
export function CacheResponse(prefix: string, ttlSeconds: number, scope: CacheScope = 'global') {
  return applyDecorators(
    SetMetadata(CACHE_RESPONSE_KEY, { prefix, ttlSeconds, scope }),
    UseInterceptors(HttpCacheInterceptor),
  );
}

/** After the handler succeeds, drop every cached entry under the given prefixes. */
export function InvalidateCache(...prefixes: string[]) {
  return applyDecorators(SetMetadata(CACHE_INVALIDATE_KEY, prefixes), UseInterceptors(HttpCacheInterceptor));
}
