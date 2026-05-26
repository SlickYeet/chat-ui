"use client"

import { IconArrowDown, IconMessagePlus } from "@tabler/icons-react"
import * as React from "react"

import { ChatInput } from "@/components/chat/chat-input"
import { ChatMessage } from "@/components/chat/chat-message"
import { GenerationStats } from "@/components/chat/generation-stats"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { trpcClient } from "@/lib/api/client"
import { useChatStore } from "@/lib/store/chat-store"

export function ChatPanel() {
  const bottomRef = React.useRef<HTMLDivElement>(null)

  const [showScrollButton, setShowScrollButton] = React.useState(false)
  const [abortController, setAbortController] =
    React.useState<AbortController | null>(null)

  const {
    conversations,
    activeConversationId,
    selectedModel,
    generation,
    createConversation,
    addMessage,
    updateMessage,
    appendToMessage,
    setGenerationStatus,
    incrementTokenCount,
    resetGeneration,
  } = useChatStore()

  const activeConversation = conversations.find(
    (c) => c.id === activeConversationId,
  )
  const messages = activeConversation?.messages ?? []
  const isGenerating =
    generation.status === "generating" ||
    generation.status === "waiting" ||
    generation.status === "loading"

  React.useEffect(
    () => {
      if (bottomRef.current) {
        bottomRef.current.scrollIntoView({
          behavior: "smooth",
        })
      }
    },
    [
      // TODO: figure out if we can remove these deps or keep them
      // messages.length, generation.tokenCount
    ],
  )

  // Check scroll position to show/hide scroll button
  const handleScroll = React.useCallback((e: React.UIEvent<HTMLDivElement>) => {
    const target = e.target as HTMLDivElement
    const isNearBottom =
      target.scrollHeight - target.scrollTop - target.clientHeight < 100
    setShowScrollButton(!isNearBottom)
  }, [])

  const scrollToBottom = React.useCallback(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [])

  const handleSendMessage = React.useCallback(
    async (content: string) => {
      if (!selectedModel) return

      // Create conversation if needed
      let conversationId = activeConversationId
      if (!conversationId) {
        conversationId = createConversation(selectedModel)
      }

      // Optimistically add user message
      addMessage(conversationId, {
        content,
        role: "user",
      })

      // Optimistically add empty assistant message for streaming
      const assistantMsgId = addMessage(conversationId, {
        content: "",
        isStreaming: true,
        role: "assistant",
      })

      // Set generation state
      setGenerationStatus("waiting")

      // Create abort controller for cancellation
      const controller = new AbortController()
      setAbortController(controller)

      try {
        const conversation = useChatStore
          .getState()
          .conversations.find((c) => c.id === conversationId)
        const apiMessages = (conversation?.messages ?? [])
          .filter((m) => m.id !== assistantMsgId)
          .map((m) => ({ content: m.content, role: m.role }))

        trpcClient.chat.streamChat.subscribe(
          { messages: apiMessages, model: selectedModel },
          {
            onComplete: () => {
              updateMessage(conversationId, assistantMsgId, {
                isStreaming: false,
              })
              setGenerationStatus("complete")
              setTimeout(resetGeneration, 2000)
              setAbortController(null)
            },
            onData: (data) => {
              if (data.type === "token") {
                setGenerationStatus("generating")
                appendToMessage(conversationId, assistantMsgId, data.content)
                incrementTokenCount()
              } else if (data.type === "complete") {
                updateMessage(conversationId, assistantMsgId, {
                  isStreaming: false,
                  stats: data.stats,
                })
                setGenerationStatus("complete")
                setTimeout(resetGeneration, 2000)
              } else if (data.type === "error") {
                updateMessage(conversationId, assistantMsgId, {
                  error: data.error,
                  isStreaming: false,
                })
                setGenerationStatus("error", data.error)
              }
            },
            onError: (error) => {
              const errorMsg =
                error instanceof Error ? error.message : "Unknown error"
              updateMessage(conversationId, assistantMsgId, {
                error: errorMsg,
                isStreaming: false,
              })
              setGenerationStatus("error", errorMsg)
              setAbortController(null)
            },
            onStopped: () => {
              setAbortController(null)
            },
            signal: controller.signal,
          },
        )
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : "Unknown error"
        updateMessage(conversationId, assistantMsgId, {
          error: errorMessage,
          isStreaming: false,
        })
        setGenerationStatus("error", errorMessage)
        setAbortController(null)
      }
    },
    [
      selectedModel,
      activeConversationId,
      createConversation,
      addMessage,
      updateMessage,
      appendToMessage,
      setGenerationStatus,
      incrementTokenCount,
      resetGeneration,
    ],
  )

  const handleStop = React.useCallback(() => {
    if (abortController) {
      abortController.abort()
      setAbortController(null)

      // Mark the last message as stopped
      if (activeConversationId && messages.length > 0) {
        const lastMessage = messages[messages.length - 1]
        if (lastMessage.isStreaming) {
          updateMessage(activeConversationId, lastMessage.id, {
            isStreaming: false,
          })
        }
      }

      resetGeneration()
    }
  }, [
    abortController,
    activeConversationId,
    messages,
    updateMessage,
    resetGeneration,
  ])

  return (
    <div className="flex h-full flex-col">
      <div className="relative flex-1 overflow-hidden">
        <ScrollArea className="h-full" onScrollCapture={handleScroll}>
          <div className="min-h-full">
            {messages.length === 0 ? (
              <div className="flex h-full min-h-100 flex-col items-center justify-center gap-4 p-8 text-center">
                <div className="rounded-full bg-secondary p-4">
                  <IconMessagePlus className="size-8 text-muted-foreground" />
                </div>
                <div>
                  <h2 className="font-semibold text-xl">
                    Start a conversation
                  </h2>
                  <p className="mt-1 text-muted-foreground text-sm">
                    Select a model and type a message to begin
                  </p>
                </div>
              </div>
            ) : (
              <div className="divide-y divide-border">
                {messages.map((message) => (
                  <ChatMessage
                    key={message.id}
                    message={message}
                    onRetry={
                      message.error
                        ? () => {
                            // TODO: Implement retry logic
                          }
                        : undefined
                    }
                  />
                ))}
              </div>
            )}
            <div className="h-4" ref={bottomRef} />
          </div>
        </ScrollArea>

        {showScrollButton && (
          <Button
            className="absolute right-4 bottom-4 rounded-full shadow-lg"
            onClick={scrollToBottom}
            size="icon"
            variant="secondary"
          >
            <IconArrowDown className="size-4" />
          </Button>
        )}
      </div>

      {isGenerating && (
        <div className="border-t bg-card/30 px-4 py-2">
          <div className="mx-auto max-w-3xl">
            <GenerationStats />
          </div>
        </div>
      )}

      <ChatInput
        isGenerating={isGenerating}
        onSend={handleSendMessage}
        onStop={handleStop}
      />
    </div>
  )
}
