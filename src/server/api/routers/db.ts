import { eq } from "drizzle-orm"
import { nanoid } from "nanoid"
import * as z from "zod"

import { createTRPCRouter, protectedProcedure } from "@/server/api/init"
import { db } from "@/server/db"
import * as schema from "@/server/db/schema"

export const dbRouter = createTRPCRouter({
  addMessage: protectedProcedure
    .input(
      z.object({
        content: z.string(),
        conversationId: z.string(),
        role: z.enum(["system", "user", "assistant"]),
      }),
    )
    .mutation(async ({ input }) => {
      const id = nanoid()
      await db.insert(schema.message).values({
        content: input.content,
        conversationId: input.conversationId,
        id,
        role: input.role,
      })
      return { id }
    }),

  addReaction: protectedProcedure
    .input(
      z.object({
        conversationId: z.string(),
        emoji: z.string(),
        messageId: z.string(),
      }),
    )
    .mutation(async ({ input }) => {
      const [msg] = await db
        .select()
        .from(schema.message)
        .where(eq(schema.message.id, input.messageId))
      const reactions = (msg?.reactions ?? {}) as Record<string, number>
      const next = {
        ...reactions,
        [input.emoji]: (reactions[input.emoji] ?? 0) + 1,
      }
      await db
        .update(schema.message)
        .set({ reactions: next })
        .where(eq(schema.message.id, input.messageId))
      return { ok: true }
    }),

  createConversation: protectedProcedure
    .input(
      z.object({
        model: z.string().optional(),
        title: z.string().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const id = nanoid()
      const userId = ctx.session.user.id
      const title = input.title ?? "New Chat"
      await db
        .insert(schema.conversation)
        .values({ id, model: input.model ?? "", title, userId })
      return { id }
    }),

  deleteMessage: protectedProcedure
    .input(
      z.object({
        conversationId: z.string(),
        messageId: z.string(),
      }),
    )
    .mutation(async ({ input }) => {
      await db
        .delete(schema.message)
        .where(eq(schema.message.id, input.messageId))
      return { ok: true }
    }),

  getConversation: protectedProcedure
    .input(
      z.object({
        id: z.string(),
      }),
    )
    .query(async ({ input }) => {
      const [row] = await db
        .select()
        .from(schema.conversation)
        .where(eq(schema.conversation.id, input.id))
      return row
    }),

  listConversations: protectedProcedure.query(async ({ ctx }) => {
    const rows = await db
      .select()
      .from(schema.conversation)
      .where(eq(schema.conversation.userId, ctx.session.user.id))
    return rows
  }),

  togglePin: protectedProcedure
    .input(
      z.object({
        conversationId: z.string(),
        messageId: z.string(),
      }),
    )
    .mutation(async ({ input }) => {
      const [msg] = await db
        .select()
        .from(schema.message)
        .where(eq(schema.message.id, input.messageId))
      await db
        .update(schema.message)
        .set({ pinned: !(msg?.pinned ?? false) })
        .where(eq(schema.message.id, input.messageId))
      return { ok: true }
    }),

  updateMessage: protectedProcedure
    .input(
      z.object({
        conversationId: z.string(),
        messageId: z.string(),
        updates: z.record(z.string(), z.unknown()),
      }),
    )
    .mutation(async ({ input }) => {
      await db
        .update(schema.message)
        .set(input.updates)
        .where(eq(schema.message.id, input.messageId))
      return { ok: true }
    }),
})
