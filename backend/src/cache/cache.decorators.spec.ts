import { Reflector } from '@nestjs/core';
import { lastValueFrom, of } from 'rxjs';
import * as jwt from 'jsonwebtoken';
import cache from './cache';
import { CacheResponse, HttpCacheInterceptor, InvalidateCache, scopeKey } from './cache.decorators';

const SECRET = 'test-secret';

describe('scopeKey', () => {
  beforeAll(() => {
    process.env.JWT_SECRET = SECRET;
  });

  const officer = (over: Record<string, any> = {}) => ({
    user: { sub: 7, roleCode: 'SHO', stateId: 1, districtId: 10, zoneId: 100, ...over },
  });

  it('global ignores the caller', () => {
    expect(scopeKey('global', officer())).toBe(scopeKey('global', officer({ districtId: 99 })));
    expect(scopeKey('global', {})).toBe(scopeKey('global', officer()));
  });

  it('jurisdiction is shared within a jurisdiction and separated across them', () => {
    expect(scopeKey('jurisdiction', officer({ sub: 1 }))).toBe(scopeKey('jurisdiction', officer({ sub: 2 })));
    expect(scopeKey('jurisdiction', officer())).not.toBe(scopeKey('jurisdiction', officer({ districtId: 11 })));
    expect(scopeKey('jurisdiction', officer())).not.toBe(scopeKey('jurisdiction', officer({ roleCode: 'DCP' })));
    expect(scopeKey('jurisdiction', officer())).not.toBe(scopeKey('jurisdiction', officer({ stateId: 2 })));
    expect(scopeKey('jurisdiction', officer())).not.toBe(scopeKey('jurisdiction', officer({ zoneId: 101 })));
  });

  it('role only varies by role code', () => {
    expect(scopeKey('role', officer())).toBe(scopeKey('role', officer({ districtId: 11 })));
    expect(scopeKey('role', officer())).not.toBe(scopeKey('role', officer({ roleCode: 'ADMIN' })));
  });

  it('user separates individual users', () => {
    expect(scopeKey('user', officer({ sub: 1 }))).not.toBe(scopeKey('user', officer({ sub: 2 })));
  });

  it('falls back to the verified bearer token on unguarded routes', () => {
    const token = jwt.sign({ sub: 7, role_code: 'SHO', state_id: 1, district_id: 10, zone_id: 100 }, SECRET);
    const fromToken = scopeKey('jurisdiction', { headers: { authorization: `Bearer ${token}` } });
    expect(fromToken).toBe(scopeKey('jurisdiction', officer()));
  });

  it('treats missing, forged and expired tokens as anonymous', () => {
    const forged = jwt.sign({ role_code: 'SUPER_ADMIN' }, 'wrong-secret');
    const expired = jwt.sign({ role_code: 'SHO', exp: Math.floor(Date.now() / 1000) - 60 }, SECRET);
    expect(scopeKey('jurisdiction', { headers: {} })).toBe('anon');
    expect(scopeKey('jurisdiction', { headers: { authorization: `Bearer ${forged}` } })).toBe('anon');
    expect(scopeKey('jurisdiction', { headers: { authorization: `Bearer ${expired}` } })).toBe('anon');
  });
});

describe('HttpCacheInterceptor', () => {
  class Demo {
    @CacheResponse('test:demo:', 60, 'jurisdiction')
    read() {}

    @InvalidateCache('test:demo:')
    write() {}
  }

  const interceptor = new HttpCacheInterceptor(new Reflector());
  const context = (handler: Function, request: any) =>
    ({ getHandler: () => handler, switchToHttp: () => ({ getRequest: () => request }) }) as any;
  const get = (user: any) => ({ method: 'GET', originalUrl: '/api/demo?x=1', user });
  const run = (handler: Function, request: any, body: any) =>
    lastValueFrom(interceptor.intercept(context(handler, request), { handle: () => of(body) }));

  beforeEach(() => cache.delPrefix('test:demo:'));

  it('serves the cached body to callers in the same jurisdiction only', async () => {
    const district10 = { roleCode: 'SHO', districtId: 10 };
    expect(await run(Demo.prototype.read, get(district10), { n: 1 })).toEqual({ n: 1 });
    expect(await run(Demo.prototype.read, get({ ...district10, sub: 99 }), { n: 2 })).toEqual({ n: 1 });
    expect(await run(Demo.prototype.read, get({ roleCode: 'SHO', districtId: 11 }), { n: 3 })).toEqual({ n: 3 });
  });

  it('does not cache failure bodies', async () => {
    const user = { roleCode: 'SHO' };
    await run(Demo.prototype.read, get(user), { success: false });
    expect(await run(Demo.prototype.read, get(user), { success: true })).toEqual({ success: true });
  });

  it('clears the prefix after a write', async () => {
    const user = { roleCode: 'SHO' };
    await run(Demo.prototype.read, get(user), { v: 'old' });
    await run(Demo.prototype.write, { method: 'POST', user }, { ok: true });
    expect(await run(Demo.prototype.read, get(user), { v: 'new' })).toEqual({ v: 'new' });
  });
});
