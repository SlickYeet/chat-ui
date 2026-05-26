"use client"

import {
  IconAlertCircle,
  IconBotId,
  IconReload,
  IconUser,
} from "@tabler/icons-react"

import {
  GenerationStats,
  StreamingIndicator,
} from "@/components/chat/generation-stats"
import { Button } from "@/components/ui/button"
import type { Message } from "@/lib/store/chat-store"
import { cn } from "@/lib/utils"

interface ChatMessageProps {
  message: Message
  onRetry?: () => void
}

export function ChatMessage({ message, onRetry }: ChatMessageProps) {
  const isUser = message.role === "user"
  const isAssistant = message.role === "assistant"

  return (
    <div
      className={cn(
        "flex gap-3 px-4 py-4",
        isUser ? "bg-transparent" : "bg-card/50",
      )}
    >
      <div
        className={cn(
          "flex size-8 shrink-0 items-center justify-center rounded-md",
          isUser
            ? "bg-primary text-primary-foreground"
            : "bg-secondary text-secondary-foreground",
        )}
      >
        {isUser ? (
          <IconUser className="size-4" />
        ) : (
          <IconBotId className="size-4" />
        )}
      </div>

      <div className="flex min-w-0 flex-1 flex-col gap-2">
        <div className="flex items-center gap-2">
          <span className="font-medium text-sm">
            {isUser ? "You" : "Assistant"}
          </span>
          {message.error && (
            <span className="flex items-center gap-1 text-error text-xs">
              <IconAlertCircle className="size-3" />
              Error
            </span>
          )}
        </div>

        <div className="prose prose-sm prose-invert max-w-none">
          {message.content ? (
            <p className="wrap-break-word whitespace-pre-wrap text-foreground/90 leading-relaxed">
              {message.content}
              {message.isStreaming && <StreamingIndicator />}
            </p>
          ) : message.isStreaming ? (
            <p className="text-muted-foreground">
              <StreamingIndicator />
            </p>
          ) : message.error ? (
            <p className="text-error">{message.error}</p>
          ) : null}
        </div>

        {isAssistant && message.stats && !message.isStreaming && (
          <GenerationStats className="mt-1" finalStats={message.stats} />
        )}

        {message.error && onRetry && (
          <Button
            className="mt-1 w-fit gap-1.5"
            onClick={onRetry}
            size="sm"
            variant="outline"
          >
            <IconReload />
            Retry
          </Button>
        )}
      </div>
    </div>
  )
}
