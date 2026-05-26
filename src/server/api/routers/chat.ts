import * as z from "zod"

import type { OllamaMessage } from "@/lib/ollama/client"
import { ollamaClient } from "@/lib/ollama/client"
import { createTRPCRouter, publicProcedure } from "@/server/api/init"

const messageSchema = z.object({
  content: z.string(),
  role: z.enum(["system", "user", "assistant"]),
})

export interface StreamChunk {
  type: "token" | "complete" | "error"
  content: string
  stats?: {
    totalDuration: number
    loadDuration: number
    promptEvalCount: number
    promptEvalDuration: number
    evalCount: number
    evalDuration: number
    tokensPerSecond: number
  }
  error?: string
}

export const chatRouter = createTRPCRouter({
  streamChat: publicProcedure
    .input(
      z.object({
        messages: z.array(messageSchema),
        model: z.string(),
      }),
    )
    .subscription(async function* ({ input }): AsyncGenerator<StreamChunk> {
      try {
        const messages = input.messages as OllamaMessage[]

        for await (const chunk of ollamaClient.streamChat(
          input.model,
          messages,
        )) {
          if (chunk.done) {
            // Calculate tokens per second
            const evalDurationSec = (chunk.eval_duration || 1) / 1_000_000_000
            const tokensPerSecond = (chunk.eval_count || 0) / evalDurationSec

            yield {
              content: chunk.message?.content || "",
              stats: {
                evalCount: chunk.eval_count || 0,
                evalDuration: chunk.eval_duration || 0,
                loadDuration: chunk.load_duration || 0,
                promptEvalCount: chunk.prompt_eval_count || 0,
                promptEvalDuration: chunk.prompt_eval_duration || 0,
                tokensPerSecond: Math.round(tokensPerSecond * 100) / 100,
                totalDuration: chunk.total_duration || 0,
              },
              type: "complete",
            }
          } else {
            yield {
              content: chunk.message?.content || "",
              type: "token",
            }
          }
        }
      } catch (error) {
        yield {
          content: "",
          error: error instanceof Error ? error.message : "Unknown error",
          type: "error",
        }
      }
    }),
})
