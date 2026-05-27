import { createClient } from "redis"

import { env } from "@/env"

const globalForRedis = globalThis as unknown as {
  redis?: ReturnType<typeof createClient>
  redisConnectPromise?: Promise<void>
}

export const redis =
  globalForRedis.redis ?? createClient({ url: env.REDIS_URL ?? undefined })

if (!globalForRedis.redis) {
  globalForRedis.redis = redis
}

if (!globalForRedis.redisConnectPromise && !redis.isOpen && !redis.isReady) {
  globalForRedis.redisConnectPromise = redis
    .connect()
    .then(() => {
      console.log("Redis connected")
    })
    .catch((e) => {
      console.warn("Redis connection failed:", e)
      globalForRedis.redisConnectPromise = undefined
    })
}

export async function getJson<T = unknown>(key: string): Promise<T | null> {
  const v = await redis.get(key)
  if (!v) return null
  try {
    return JSON.parse(v) as T
  } catch {
    return null
  }
}

export async function setJson(
  key: string,
  value: unknown,
  ttlSeconds?: number,
) {
  const s = JSON.stringify(value)
  if (ttlSeconds) {
    await redis.set(key, s, { EX: ttlSeconds })
  } else {
    await redis.set(key, s)
  }
}

export default redis
