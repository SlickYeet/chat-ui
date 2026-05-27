"use client"

import {
  IconAlertCircle,
  IconBotId,
  IconCopy,
  IconReload,
  IconTrash,
  IconUser,
} from "@tabler/icons-react"
import * as React from "react"
import { toast } from "sonner"

import {
  GenerationStats,
  StreamingIndicator,
} from "@/components/chat/generation-stats"
import { Button } from "@/components/ui/button"
import type { Message } from "@/lib/store/chat-store"
import { useChatStore } from "@/lib/store/chat-store"
import { cn } from "@/lib/utils"

interface ChatMessageProps {
  message: Message
  onRetry?: () => void
}

export function ChatMessage({ message, onRetry }: ChatMessageProps) {
  const isUser = message.role === "user"
  const isAssistant = message.role === "assistant"

  const deleteMessage = useChatStore((s) => s.deleteMessage)
  const activeConversationId = useChatStore((s) => s.activeConversationId)
  const updateMessageStore = useChatStore((s) => s.updateMessage)

  const [isEditing, setIsEditing] = React.useState(false)
  const [editValue, setEditValue] = React.useState(message.content)

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(message.content)
      toast.success("Message copied")
    } catch (_e) {
      toast.error("Failed to copy")
    }
  }

  const handleDelete = () => {
    if (!activeConversationId) return
    deleteMessage(activeConversationId, message.id)
    toast.success("Message deleted")
  }

  const handleSaveEdit = () => {
    if (!activeConversationId) return
    updateMessageStore(activeConversationId, message.id, {
      content: editValue,
    })
    setIsEditing(false)
    toast.success("Message updated")
  }

  return (
    <div
      className={cn(
        "flex gap-4 px-4 py-3",
        "items-start",
        isUser ? "justify-end" : "justify-start",
      )}
    >
      {!isUser && (
        <div
          className={cn(
            "flex size-8 shrink-0 items-center justify-center rounded-md",
            isUser
              ? "bg-primary text-primary-foreground"
              : "bg-secondary text-secondary-foreground",
          )}
        >
          <IconBotId className="size-4" />
        </div>
      )}

      <div
        className={cn(
          "min-w-0 flex-1",
          isUser ? "max-w-3/4 text-right" : "max-w-3/4 text-left",
        )}
      >
        <div
          className={cn(
            "rounded-lg p-4 shadow-sm",
            isUser ? "bg-primary/8 text-primary-foreground/95" : "bg-card/60",
          )}
        >
          <div className="flex items-center justify-between gap-2">
            <span className="font-medium text-sm">
              {isUser ? "You" : "Assistant"}
            </span>
            <div className="flex items-baseline gap-3">
              <time className="text-muted-foreground text-xs">
                {new Date(message.createdAt).toLocaleTimeString()}
              </time>
            </div>
            <div className="flex items-center gap-2">
              {message.error && (
                <span className="flex items-center gap-1 text-error text-xs">
                  <IconAlertCircle className="size-3" />
                  Error
                </span>
              )}
              <button
                aria-label="Copy message"
                className="rounded-md p-1 hover:bg-muted/40"
                onClick={handleCopy}
                title="Copy"
                type="button"
              >
                <IconCopy className="size-3" />
              </button>
              <button
                aria-label="Delete message"
                className="rounded-md p-1 hover:bg-muted/40"
                onClick={handleDelete}
                title="Delete"
                type="button"
              >
                <IconTrash className="size-3 text-destructive" />
              </button>
            </div>
          </div>

          <div className="prose prose-sm prose-invert mt-2 max-w-none">
            {isEditing ? (
              <div>
                <textarea
                  className="w-full rounded-md bg-input/30 p-2 text-sm"
                  onChange={(e) => setEditValue(e.target.value)}
                  value={editValue}
                />
                <div className="mt-2 flex justify-end gap-2">
                  <Button
                    onClick={() => setIsEditing(false)}
                    size="sm"
                    variant="outline"
                  >
                    Cancel
                  </Button>
                  <Button onClick={handleSaveEdit} size="sm">
                    Save
                  </Button>
                </div>
              </div>
            ) : message.content ? (
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
            <GenerationStats className="mt-3" finalStats={message.stats} />
          )}

          {message.error && onRetry && (
            <div className="mt-3 text-right">
              <Button onClick={onRetry} size="sm" variant="outline">
                <IconReload />
                Retry
              </Button>
            </div>
          )}
        </div>
      </div>

      {isUser && (
        <div
          className={cn(
            "flex size-8 shrink-0 items-center justify-center rounded-md",
            isUser
              ? "bg-primary text-primary-foreground"
              : "bg-secondary text-secondary-foreground",
          )}
        >
          <IconUser className="size-4" />
        </div>
      )}
    </div>
  )
}
