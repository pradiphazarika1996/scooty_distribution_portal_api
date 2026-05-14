import Redis from "ioredis";
import { RedisKey } from "../helpers/redisKeys";

const REDIS_URL = process.env.REDIS_URL || "";
const REDIS_PORT = 6379;

export const awsRedisClient = new Redis("redis://localhost:6379", {
  maxRetriesPerRequest: 3,
  enableReadyCheck: true,
  lazyConnect: true,
  reconnectOnError: () => true,
});

// export const awsRedisClient = new Redis.Cluster(
//   [
//     {
//       host: REDIS_URL,
//       port: REDIS_PORT,
//     },
//   ],
//   {
//     lazyConnect: true,
//     scaleReads: 'all',
//     redisOptions: {
//       tls: {
//         servername: REDIS_URL,
//       },
//       maxRetriesPerRequest: 3,
//       enableReadyCheck: true,
//       reconnectOnError: () => true,
//     },
//   }
// );

export async function setAwsRedis(
  key: string,
  data: any,
  ttl: number = 0,
): Promise<void> {
  try {
    await awsRedisClient.set(key, JSON.stringify(data));

    if (ttl > 0) {
      await awsRedisClient.expire(key, ttl);
    }
  } catch (error: any) {
    console.error("setRedisScope error", error);
  }
}

export async function getAwsRedis<T>(key: string): Promise<T | null> {
  try {
    const value = await awsRedisClient.get(key);
    return value ? JSON.parse(value) : null;
  } catch (error: any) {
    console.error("getRedis error", error);
    return null;
  }
}

export async function clearRedis(key: string): Promise<void> {
  try {
    await awsRedisClient.del(key);
  } catch (error: any) {
    console.error("clearSession error", error);
  }
}

export async function getApiCache<T>(name: string): Promise<T | null> {
  const key = RedisKey.apiCache(name);
  return getAwsRedis<T>(key);
}

export async function setApiCache<T>(name: string, data: T): Promise<void> {
  const key = RedisKey.apiCache(name);
  await setAwsRedis(key, data);
}

export async function resetApiCache(name: string): Promise<void> {
  const key = RedisKey.apiCache(name);
  try {
    await clearRedis(key);
  } catch (error) {
    console.error("resetApiCache error", error);
  }
}

export const getCacheKey = (apiName: string, id: any) => `${apiName}:${id}`;
