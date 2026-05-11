import Redis from 'ioredis';
import { RedisKey } from '../helpers/redisKeys';

export const redisClient = new Redis('redis://localhost:6379', {
  maxRetriesPerRequest: 3,
  enableReadyCheck: true,
  lazyConnect: true,
  reconnectOnError: () => true,
});

export async function setRedis(key: string, data: any, ttl: number = 0): Promise<void> {
  try {
    await redisClient.set(key, JSON.stringify(data));

    if (ttl > 0) {
      await redisClient.expire(key, ttl);
    }
  } catch (error: any) {
    console.error('setRedisScope error', error);
  }
}

export async function getRedis<T>(key: string): Promise<T | null> {
  try {
    const value = await redisClient.get(key);
    return value ? JSON.parse(value) : null;
  } catch (error: any) {
    console.error('getRedis error', error);
    return null;
  }
}

export async function clearRedis(key: string): Promise<void> {
  try {
    await redisClient.del(key);
  } catch (error: any) {
    console.error('clearSession error', error);
  }
}

export async function getApiCache<T>(name: string): Promise<T | null> {
  const key = RedisKey.apiCache(name);
  return getRedis<T>(key);
}

export async function setApiCache<T>(name: string, data: T): Promise<void> {
  const key = RedisKey.apiCache(name);
  await setRedis(key, data);
}

export async function resetApiCache(name: string): Promise<void> {
  const key = RedisKey.apiCache(name);
  try {
    await clearRedis(key);
  } catch (error) {
    console.error('resetApiCache error', error);
  }
}

export const getCacheKey = (apiName: string, id: any) => `${apiName}:${id}`;
