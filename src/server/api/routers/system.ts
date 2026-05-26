import { ollamaClient } from "@/lib/ollama/client"
import { createTRPCRouter, publicProcedure } from "@/server/api/init"

export const systemRouter = createTRPCRouter({
  health: publicProcedure.query(async () => {
    try {
      await ollamaClient.getVersion()
      return {
        status: "connected",
        url: ollamaClient.baseUrl,
      }
    } catch {
      return {
        status: "disconnected",
        url: ollamaClient.baseUrl,
      }
    }
  }),

  version: publicProcedure.query(async () => {
    try {
      return await ollamaClient.getVersion()
    } catch {
      return {
        error: "Could not connect to Ollama",
        version: "unknown",
      }
    }
  }),
})
