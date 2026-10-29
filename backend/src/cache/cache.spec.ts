import cache from './cache';

// REDIS_URL is unset under jest, so this exercises the in-memory store
describe('cache (memory backend)', () => {
  it('round-trips values and restores Date objects', async () => {
    const createdAt = new Date('2026-01-02T03:04:05.000Z');
    await cache.set('test:date', { id: 1, createdAt, nested: [{ at: createdAt }] }, 60);

    const hit = await cache.get<any>('test:date');
    expect(hit.createdAt).toBeInstanceOf(Date);
    expect(hit.createdAt.getTime()).toBe(createdAt.getTime());
    expect(hit.nested[0].at).toBeInstanceOf(Date);
  });

  it('returns copies, so callers cannot mutate the cached value', async () => {
    await cache.set('test:copy', { list: [1] }, 60);
    const first = await cache.get<any>('test:copy');
    first.list.push(2);
    expect(await cache.get('test:copy')).toEqual({ list: [1] });
  });

  it('wrap() runs the loader once for concurrent misses', async () => {
    const loader = jest.fn(async () => 'value');
    const results = await Promise.all([
      cache.wrap('test:wrap', 60, loader),
      cache.wrap('test:wrap', 60, loader),
      cache.wrap('test:wrap', 60, loader),
    ]);
    expect(results).toEqual(['value', 'value', 'value']);
    expect(loader).toHaveBeenCalledTimes(1);
    await cache.wrap('test:wrap', 60, loader);
    expect(loader).toHaveBeenCalledTimes(1);
  });

  it('wrap() does not cache a loader failure', async () => {
    await expect(cache.wrap('test:fail', 60, async () => { throw new Error('db down'); })).rejects.toThrow('db down');
    expect(await cache.wrap('test:fail', 60, async () => 'recovered')).toBe('recovered');
  });

  it('delPrefix() removes only matching keys', async () => {
    await cache.set('ref:a:1', 1, 60);
    await cache.set('ref:a:2', 2, 60);
    await cache.set('ref:b:1', 3, 60);
    await cache.delPrefix('ref:a:');
    expect(await cache.get('ref:a:1')).toBeUndefined();
    expect(await cache.get('ref:a:2')).toBeUndefined();
    expect(await cache.get('ref:b:1')).toBe(3);
  });

  it('expires entries after their TTL', async () => {
    jest.useFakeTimers({ now: Date.now() });
    try {
      await cache.set('test:ttl', 'x', 1);
      jest.setSystemTime(Date.now() + 1500);
      expect(await cache.get('test:ttl')).toBeUndefined();
    } finally {
      jest.useRealTimers();
    }
  });
});
