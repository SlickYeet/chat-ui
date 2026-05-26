import { create } from "zustand"
import { createJSONStorage, persist } from "zustand/middleware"

export interface Message {
  id: string
  role: "system" | "user" | "assistant"
  content: string
  createdAt: number
  isStreaming?: boolean
  error?: string
  stats?: {
    totalDuration: number
    loadDuration: number
    promptEvalCount: number
    promptEvalDuration: number
    evalCount: number
    evalDuration: number
    tokensPerSecond: number
  }
}

export interface Conversation {
  id: string
  title: string
  model: string
  messages: Message[]
  createdAt: number
  updatedAt: number
}

export interface GenerationState {
  status: "idle" | "waiting" | "loading" | "generating" | "complete" | "error"
  tokenCount: number
  startTime: number | null
  elapsedMs: number
  tokensPerSecond: number
  error?: string
}

interface ChatState {
  // Conversations
  conversations: Conversation[]
  activeConversationId: string | null

  // Generation tracking
  generation: GenerationState

  // Settings
  selectedModel: string | null

  // Actions
  createConversation: (model: string) => string
  deleteConversation: (id: string) => void
  setActiveConversation: (id: string | null) => void
  updateConversationTitle: (id: string, title: string) => void

  // Message actions
  addMessage: (
    conversationId: string,
    message: Omit<Message, "id" | "createdAt">,
  ) => string
  updateMessage: (
    conversationId: string,
    messageId: string,
    updates: Partial<Message>,
  ) => void
  appendToMessage: (
    conversationId: string,
    messageId: string,
    content: string,
  ) => void
  deleteMessage: (conversationId: string, messageId: string) => void

  // Generation state
  setGenerationStatus: (
    status: GenerationState["status"],
    error?: string,
  ) => void
  incrementTokenCount: () => void
  resetGeneration: () => void
  updateGenerationTiming: () => void

  // Model selection
  setSelectedModel: (model: string | null) => void

  // Helpers
  getActiveConversation: () => Conversation | null
  getConversationMessages: (conversationId: string) => Message[]
}

const generateId = () =>
  `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`

function generateTitle(content: string) {
  const words = content.trim().split(/\s+/).slice(0, 6)
  const title = words.join(" ")
  return title.length > 40 ? `${title.slice(0, 40)}...` : title || "New Chat"
}

export const useChatStore = create<ChatState>()(
  persist(
    (set, get) => ({
      activeConversationId: null,

      addMessage: (conversationId, message) => {
        const id = generateId()
        const newMessage: Message = {
          ...message,
          createdAt: Date.now(),
          id,
        }

        set((state) => ({
          conversations: state.conversations.map((c) => {
            if (c.id !== conversationId) return c

            const updatedConversation = {
              ...c,
              messages: [...c.messages, newMessage],
              updatedAt: Date.now(),
            }

            // Auto-generate title from first user message
            if (
              message.role === "user" &&
              c.messages.filter((m) => m.role === "user").length === 0
            ) {
              updatedConversation.title = generateTitle(message.content)
            }

            return updatedConversation
          }),
        }))

        return id
      },

      appendToMessage: (conversationId, messageId, content) => {
        set((state) => ({
          conversations: state.conversations.map((c) =>
            c.id === conversationId
              ? {
                  ...c,
                  messages: c.messages.map((m) =>
                    m.id === messageId
                      ? { ...m, content: m.content + content }
                      : m,
                  ),
                }
              : c,
          ),
        }))
      },
      conversations: [],

      createConversation: (model) => {
        const id = generateId()
        const conversation: Conversation = {
          createdAt: Date.now(),
          id,
          messages: [],
          model,
          title: "New Chat",
          updatedAt: Date.now(),
        }
        set((state) => ({
          activeConversationId: id,
          conversations: [conversation, ...state.conversations],
          selectedModel: model,
        }))
        return id
      },

      deleteConversation: (id) => {
        set((state) => {
          const newConversations = state.conversations.filter(
            (c) => c.id !== id,
          )
          const newActiveId =
            state.activeConversationId === id
              ? (newConversations[0]?.id ?? null)
              : state.activeConversationId
          return {
            activeConversationId: newActiveId,
            conversations: newConversations,
          }
        })
      },

      deleteMessage: (conversationId, messageId) => {
        set((state) => ({
          conversations: state.conversations.map((c) =>
            c.id === conversationId
              ? {
                  ...c,
                  messages: c.messages.filter((m) => m.id !== messageId),
                  updatedAt: Date.now(),
                }
              : c,
          ),
        }))
      },
      generation: {
        elapsedMs: 0,
        startTime: null,
        status: "idle",
        tokenCount: 0,
        tokensPerSecond: 0,
      },

      getActiveConversation: () => {
        const state = get()
        return (
          state.conversations.find(
            (c) => c.id === state.activeConversationId,
          ) ?? null
        )
      },

      getConversationMessages: (conversationId) => {
        const state = get()
        const conversation = state.conversations.find(
          (c) => c.id === conversationId,
        )
        return conversation?.messages ?? []
      },

      incrementTokenCount: () => {
        set((state) => {
          const now = Date.now()
          const elapsed = state.generation.startTime
            ? now - state.generation.startTime
            : 0
          const newTokenCount = state.generation.tokenCount + 1
          const tokensPerSecond =
            elapsed > 0 ? (newTokenCount / elapsed) * 1000 : 0

          return {
            generation: {
              ...state.generation,
              elapsedMs: elapsed,
              tokenCount: newTokenCount,
              tokensPerSecond: Math.round(tokensPerSecond * 100) / 100,
            },
          }
        })
      },

      resetGeneration: () => {
        set({
          generation: {
            elapsedMs: 0,
            startTime: null,
            status: "idle",
            tokenCount: 0,
            tokensPerSecond: 0,
          },
        })
      },
      selectedModel: null,

      setActiveConversation: (id) => {
        set((state) => {
          const conversation = state.conversations.find((c) => c.id === id)
          return {
            activeConversationId: id,
            selectedModel: conversation?.model ?? state.selectedModel,
          }
        })
      },

      setGenerationStatus: (status, error) => {
        set((state) => ({
          generation: {
            ...state.generation,
            error,
            startTime:
              status === "generating" && !state.generation.startTime
                ? Date.now()
                : state.generation.startTime,
            status,
          },
        }))
      },

      setSelectedModel: (model) => {
        set({ selectedModel: model })
      },

      updateConversationTitle: (id, title) => {
        set((state) => ({
          conversations: state.conversations.map((c) =>
            c.id === id ? { ...c, title, updatedAt: Date.now() } : c,
          ),
        }))
      },

      updateGenerationTiming: () => {
        set((state) => {
          if (!state.generation.startTime) return state
          const elapsed = Date.now() - state.generation.startTime
          const tokensPerSecond =
            elapsed > 0 ? (state.generation.tokenCount / elapsed) * 1000 : 0
          return {
            generation: {
              ...state.generation,
              elapsedMs: elapsed,
              tokensPerSecond: Math.round(tokensPerSecond * 100) / 100,
            },
          }
        })
      },

      updateMessage: (conversationId, messageId, updates) => {
        set((state) => ({
          conversations: state.conversations.map((c) =>
            c.id === conversationId
              ? {
                  ...c,
                  messages: c.messages.map((m) =>
                    m.id === messageId ? { ...m, ...updates } : m,
                  ),
                  updatedAt: Date.now(),
                }
              : c,
          ),
        }))
      },
    }),
    {
      name: "ollama-chat-store",
      partialize: (state) => ({
        activeConversationId: state.activeConversationId,
        conversations: state.conversations,
        selectedModel: state.selectedModel,
      }),
      storage: createJSONStorage(() => localStorage),
    },
  ),
)
