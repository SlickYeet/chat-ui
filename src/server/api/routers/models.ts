import * as z from "zod"

import { ollamaClient } from "@/lib/ollama/client"
import { createTRPCRouter, publicProcedure } from "@/server/api/init"

export interface PullProgress {
  status: string
  digest?: string
  total?: number
  completed?: number
  percent?: number
}

export const modelsRouter = createTRPCRouter({
  delete: publicProcedure
    .input(z.object({ model: z.string() }))
    .mutation(async ({ input }) => {
      await ollamaClient.deleteModel(input.model)
      return { success: true }
    }),
  list: publicProcedure.query(async () => {
    return ollamaClient.listModels()
  }),

  pull: publicProcedure
    .input(z.object({ model: z.string() }))
    .subscription(async function* ({ input }): AsyncGenerator<PullProgress> {
      try {
        for await (const chunk of ollamaClient.streamPull(input.model)) {
          const percent =
            chunk.total && chunk.completed
              ? Math.round((chunk.completed / chunk.total) * 100)
              : undefined

          yield {
            completed: chunk.completed,
            digest: chunk.digest,
            percent,
            status: chunk.status,
            total: chunk.total,
          }
        }
      } catch (error) {
        yield {
          status: `Error: ${error instanceof Error ? error.message : "Unknown error"}`,
        }
      }
    }),

  running: publicProcedure.query(async () => {
    try {
      return await ollamaClient.listRunning()
    } catch {
      return {
        models: [],
      }
    }
  }),

  show: publicProcedure
    .input(z.object({ model: z.string() }))
    .query(async ({ input }) => {
      return ollamaClient.showModel(input.model)
    }),
})
