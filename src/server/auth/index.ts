import { betterAuth } from "better-auth"
import { drizzleAdapter } from "better-auth/adapters/drizzle"
import { nextCookies } from "better-auth/next-js"

import { env } from "@/env"
import { db } from "@/server/db"
import { redis } from "@/server/redis"

export const auth = betterAuth({
  baseURL: env.NEXT_PUBLIC_URL,
  database: drizzleAdapter(db, {
    provider: "pg",
  }),
  plugins: [nextCookies()],
  secondaryStorage: {
    async delete(key: string) {
      await redis.del(key)
    },
    async get(key: string) {
      return redis.get(key)
    },
    async getAndDelete(key: string) {
      const value = await redis.get(key)
      if (value) {
        await redis.del(key)
      }
      return value
    },
    async set(key: string, value: string, ttlSeconds?: number) {
      if (ttlSeconds) {
        await redis.set(key, value, { EX: ttlSeconds })
        return
      }

      await redis.set(key, value)
    },
  },
  session: {
    cookieCache: {
      enabled: true,
      refreshCache: false,
    },
  },
  socialProviders: {
    discord: {
      clientId: env.DISCORD_CLIENT_ID,
      clientSecret: env.DISCORD_CLIENT_SECRET,
      disableImplicitSignUp: true,
    },
  },
})
