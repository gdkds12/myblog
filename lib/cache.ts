import Redis from 'ioredis';

const redisEnabled = !!(process.env.REDIS_URL || process.env.REDIS_HOST);

/**
 * Singleton Redis client so that multiple imports share the same connection.
 */
const getRedisClient = (() => {
  let client: Redis | null = null;
  return () => {
    if (client) return client;

    const url = process.env.REDIS_URL ||
      (process.env.REDIS_HOST ? `redis://${process.env.REDIS_HOST}:${process.env.REDIS_PORT || 6379}` : undefined);

    if (!url) {
      // Fallback: return a dummy in-memory cache in dev/test when Redis env is missing.
      if (process.env.NODE_ENV !== 'production') {
        console.warn('[cache] Redis env not set – falling back to in-memory cache');
        const mem = new Map<string,string>();
        // minimal interface subset we use (get/set)
        // @ts-ignore – widen type to satisfy callers
        client = {
          get: async (k:string)=> mem.get(k) ?? null,
          set: async (_k:string,_v:string,_mode?:string,_ttl?:number)=> { mem.set(_k,_v); return 'OK'; }
        } as unknown as Redis;
        return client;
      }
      throw new Error('Redis is not configured. Please set REDIS_URL or REDIS_HOST/REDIS_PORT env variables.');
    }

    client = new Redis(url, {
      // If you use a password: format redis://:password@host:port
      lazyConnect: true, // connect on first command to avoid cost in cold paths
      maxRetriesPerRequest: 2,
    });
    return client;
  };
})();

export function getRedis() {
  return getRedisClient();
}

export async function getString(key: string): Promise<string | null> {
  try {
    const redis = getRedisClient();
    return await redis.get(key);
  } catch (err) {
    console.warn('[cache] Redis getString failed', (err as Error).message);
    return null;
  }
}

export async function setString(key: string, value: string, ttlSeconds?: number): Promise<void> {
  try {
    const redis = getRedisClient();
    if (ttlSeconds) await redis.set(key, value, 'EX', ttlSeconds);
    else await redis.set(key, value);
  } catch (err) {
    console.warn('[cache] Redis setString failed', (err as Error).message);
  }
}

export async function getCachedJson<T>(key: string): Promise<T | null> {
  try {
    const redis = getRedisClient();
    const cached = await redis.get(key);
    return cached ? (JSON.parse(cached) as T) : null;
  } catch (err) {
    console.warn('[cache] Redis get failed', (err as Error).message);
    return null;
  }
}

export async function setCachedJson(key: string, value: unknown, ttlSeconds: number): Promise<void> {
  try {
    const redis = getRedisClient();
    await redis.set(key, JSON.stringify(value), 'EX', ttlSeconds);
  } catch (err) {
    console.warn('[cache] Redis set failed', (err as Error).message);
  }
}
