import Redis from 'ioredis';
import { Logger } from '@nestjs/common';

/**
 * Shared cache used across the backend.
 *
 * - Uses Redis when REDIS_URL is set, so every backend instance shares one cache
 *   and invalidations are seen by all of them.
 * - Falls back to a per-process in-memory store when REDIS_URL is unset (local dev).
 * - Fails open: if Redis is unreachable, reads miss and the loader runs against the DB.
 *   A cache outage must never take the API down.
 *
 * Values are JSON-serialised in both modes, so callers always get a fresh copy and
 * Date objects round-trip as Date (not ISO strings).
 */

const logger = new Logger('Cache');
const KEY_PREFIX = process.env.CACHE_KEY_PREFIX || 'alms:v1:';
const DATE_TAG = '__$date';

function serialize(value: unknown): string {
  return JSON.stringify(value, function (this: any, key: string, val: unknown) {
    const raw = this[key];
    if (raw instanceof Date) return { [DATE_TAG]: raw.toISOString() };
    if (typeof raw === 'bigint') return raw.toString();
    return val;
  });
}

function deserialize<T>(text: string): T {
  return JSON.parse(text, (_key, val) => {
    if (val && typeof val === 'object' && typeof val[DATE_TAG] === 'string' && Object.keys(val).length === 1) {
      return new Date(val[DATE_TAG]);
    }
    return val;
  });
}

interface Store {
  get(key: string): Promise<string | null>;
  set(key: string, value: string, ttlSeconds: number): Promise<void>;
  del(keys: string[]): Promise<void>;
  delPrefix(prefix: string): Promise<void>;
  isHealthy(): Promise<boolean>;
  close(): Promise<void>;
}

class MemoryStore implements Store {
  private readonly map = new Map<string, { value: string; expiresAt: number }>();
  private readonly maxEntries = Number(process.env.CACHE_MEMORY_MAX_ENTRIES || 5000);

  async get(key: string) {
    const hit = this.map.get(key);
    if (!hit) return null;
    if (hit.expiresAt <= Date.now()) {
      this.map.delete(key);
      return null;
    }
    return hit.value;
  }

  async set(key: string, value: string, ttlSeconds: number) {
    if (this.map.size >= this.maxEntries) {
      // Map preserves insertion order: drop the oldest entry
      const oldest = this.map.keys().next().value;
      if (oldest !== undefined) this.map.delete(oldest);
    }
    this.map.set(key, { value, expiresAt: Date.now() + ttlSeconds * 1000 });
  }

  async del(keys: string[]) {
    keys.forEach((k) => this.map.delete(k));
  }

  async delPrefix(prefix: string) {
    for (const key of this.map.keys()) {
      if (key.startsWith(prefix)) this.map.delete(key);
    }
  }

  async isHealthy() {
    return true;
  }

  async close() {
    this.map.clear();
  }
}

class RedisStore implements Store {
  private readonly client: Redis;

  constructor(url: string) {
    this.client = new Redis(url, {
      // Don't queue commands forever while disconnected - fail fast so we fall back to the DB
      enableOfflineQueue: false,
      maxRetriesPerRequest: 1,
      connectTimeout: 5000,
      retryStrategy: (times) => Math.min(times * 500, 10000),
    });
    let lastErrorLog = 0;
    this.client.on('error', (err) => {
      // Throttle: a down Redis would otherwise log on every reconnect attempt
      if (Date.now() - lastErrorLog > 60000) {
        lastErrorLog = Date.now();
        logger.warn(`Redis error (serving from DB until it recovers): ${err.message}`);
      }
    });
    this.client.on('ready', () => logger.log('Redis connected'));
  }

  async get(key: string) {
    return this.client.get(key);
  }

  async set(key: string, value: string, ttlSeconds: number) {
    await this.client.set(key, value, 'EX', Math.max(1, Math.round(ttlSeconds)));
  }

  async del(keys: string[]) {
    if (keys.length) await this.client.unlink(...keys);
  }

  async delPrefix(prefix: string) {
    let cursor = '0';
    do {
      const [next, keys] = await this.client.scan(cursor, 'MATCH', `${prefix}*`, 'COUNT', 500);
      cursor = next;
      if (keys.length) await this.client.unlink(...keys);
    } while (cursor !== '0');
  }

  async isHealthy() {
    try {
      return (await this.client.ping()) === 'PONG';
    } catch {
      return false;
    }
  }

  async close() {
    await this.client.quit().catch(() => this.client.disconnect());
  }
}

class CacheClient {
  readonly backend: 'redis' | 'memory';
  private readonly store: Store;
  /** In-flight loaders, so concurrent misses for one key hit the DB once per process */
  private readonly inflight = new Map<string, Promise<unknown>>();

  constructor() {
    const url = process.env.REDIS_URL;
    const disabled = process.env.CACHE_DISABLED === 'true';
    if (url && !disabled) {
      this.store = new RedisStore(url);
      this.backend = 'redis';
    } else {
      this.store = new MemoryStore();
      this.backend = 'memory';
      if (process.env.NODE_ENV === 'production' && !disabled) {
        logger.warn('REDIS_URL not set - using per-process in-memory cache');
      }
    }
  }

  get enabled() {
    return process.env.CACHE_DISABLED !== 'true';
  }

  async get<T>(key: string): Promise<T | undefined> {
    if (!this.enabled) return undefined;
    try {
      const text = await this.store.get(KEY_PREFIX + key);
      return text == null ? undefined : deserialize<T>(text);
    } catch {
      return undefined;
    }
  }

  async set(key: string, value: unknown, ttlSeconds: number): Promise<void> {
    if (!this.enabled || value === undefined) return;
    try {
      await this.store.set(KEY_PREFIX + key, serialize(value), ttlSeconds);
    } catch {
      // fail open
    }
  }

  /** Return the cached value for `key`, or run `loader`, cache its result and return it. */
  async wrap<T>(key: string, ttlSeconds: number, loader: () => Promise<T>): Promise<T> {
    const cached = await this.get<T>(key);
    if (cached !== undefined) return cached;

    const pending = this.inflight.get(key) as Promise<T> | undefined;
    if (pending) return pending;

    const promise = (async () => {
      try {
        const value = await loader();
        await this.set(key, value, ttlSeconds);
        return value;
      } finally {
        this.inflight.delete(key);
      }
    })();
    this.inflight.set(key, promise);
    return promise;
  }

  async del(...keys: string[]): Promise<void> {
    try {
      await this.store.del(keys.map((k) => KEY_PREFIX + k));
    } catch (err: any) {
      logger.warn(`Cache delete failed for ${keys.join(', ')}: ${err?.message}`);
    }
  }

  /** Delete every key that starts with `prefix` (e.g. "ref:locations:"). */
  async delPrefix(...prefixes: string[]): Promise<void> {
    await Promise.all(
      prefixes.map(async (prefix) => {
        try {
          await this.store.delPrefix(KEY_PREFIX + prefix);
        } catch (err: any) {
          logger.warn(`Cache prefix delete failed for ${prefix}: ${err?.message}`);
        }
      }),
    );
  }

  isHealthy() {
    return this.store.isHealthy();
  }

  close() {
    return this.store.close();
  }
}

const cache = new CacheClient();

export default cache;

/** Central list of key prefixes so writers and readers agree on names. */
export const CacheKeys = {
  authUser: (userId: number) => `auth:user:${userId}`,
  authUserPrefix: 'auth:user:',
  locations: 'ref:locations:',
  statuses: 'ref:statuses:',
  actions: 'ref:actions:',
  weapons: 'ref:weapons:',
  flowMapping: 'ref:flow-mapping:',
  roles: 'ref:roles:',
  permissions: 'ref:permissions:',
  licenseStats: 'stats:licenses:',
  licenseLists: 'lists:licenses:',
  analytics: 'stats:analytics:',
  publicDashboard: 'stats:public:',
} as const;

const ttl = (envName: string, fallback: number) => {
  const value = Number(process.env[envName]);
  return Number.isFinite(value) && value > 0 ? value : fallback;
};

/** Cache lifetimes in seconds. Data with explicit invalidation can live long; the rest is time-bound. */
export const CacheTtl = {
  /** Admin-edited reference data; every write endpoint clears it */
  reference: 3600,
  /** Dashboard analytics: no write-side invalidation, so kept short */
  analytics: ttl('ANALYTICS_CACHE_TTL', 60),
  /** License counters and expiring/expired lists: written from several services */
  licenses: ttl('LICENSE_STATS_CACHE_TTL', 30),
  /** Unauthenticated public dashboard */
  publicDashboard: ttl('PUBLIC_DASHBOARD_CACHE_TTL', 120),
} as const;
