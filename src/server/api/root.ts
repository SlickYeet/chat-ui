import { createCallerFactory, createTRPCRouter } from "@/server/api/init"
import { chatRouter } from "@/server/api/routers/chat"
import { dbRouter } from "@/server/api/routers/db"
import { modelsRouter } from "@/server/api/routers/models"
import { systemRouter } from "@/server/api/routers/system"

export const appRouter = createTRPCRouter({
  chat: chatRouter,
  db: dbRouter,
  models: modelsRouter,
  system: systemRouter,
})

export type AppRouter = typeof appRouter

export const createCaller = createCallerFactory(appRouter)
