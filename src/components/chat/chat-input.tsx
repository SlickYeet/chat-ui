"use client"

import { IconSend, IconSquare } from "@tabler/icons-react"
import * as React from "react"

import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Spinner } from "@/components/ui/spinner"
import { Textarea } from "@/components/ui/textarea"
import { api } from "@/lib/api/client"
import { useChatStore } from "@/lib/store/chat-store"

interface ChatInputProps {
  onSend: (content: string) => void
  onStop?: () => void
  isGenerating: boolean
  disabled?: boolean
}

export function ChatInput({
  onSend,
  onStop,
  isGenerating,
  disabled,
}: ChatInputProps) {
  const textareaRef = React.useRef<HTMLTextAreaElement>(null)

  const [input, setInput] = React.useState("")
  const [isMounted, setIsMounted] = React.useState(false)

  const { selectedModel, setSelectedModel } = useChatStore()

  const [{ models }, { isLoading }] = api.models.list.useSuspenseQuery()

  React.useEffect(() => {
    setIsMounted(true)
  }, [])

  // Auto-select first model if none selected
  React.useEffect(() => {
    if (!isMounted || selectedModel || models.length === 0) {
      return
    }

    setSelectedModel(models[0].name)
  }, [isMounted, models, selectedModel, setSelectedModel])

  // Auto-resize textarea
  // TODO: replace with react-textarea-autosize
  // biome-ignore lint/correctness/useExhaustiveDependencies: we only want to run this when input changes, not when textareaRef changes
  React.useEffect(() => {
    const textarea = textareaRef.current
    if (textarea) {
      textarea.style.height = "auto"
      textarea.style.height = `${Math.min(textarea.scrollHeight, 200)}px`
    }
  }, [input])

  const handleSubmit = React.useCallback(() => {
    if (!input.trim() || isGenerating || !selectedModel) return
    onSend(input.trim())
    setInput("")
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto"
    }
  }, [input, isGenerating, selectedModel, onSend])

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSubmit()
    }
  }

  return (
    <div className="border-t bg-card/50 p-4">
      <div className="mx-auto max-w-3xl">
        <div className="mb-3 flex items-center gap-2">
          <span className="text-muted-foreground text-xs">Model:</span>
          <Select
            disabled={isGenerating || isLoading}
            onValueChange={setSelectedModel}
            value={selectedModel ?? ""}
          >
            <SelectTrigger className="h-7 min-w-52 gap-2 text-xs">
              {isLoading ? (
                <Spinner className="size-3" />
              ) : (
                <SelectValue placeholder="Select a model" />
              )}
            </SelectTrigger>
            <SelectContent className="w-auto">
              <SelectGroup>
                {models.map((model) => (
                  <SelectItem
                    className="text-xs"
                    key={model.name}
                    value={model.name}
                  >
                    <span className="font-mono">{model.name}</span>
                    <span className="text-muted-foreground">
                      ({(model.size / 1e9).toFixed(1)}GB)
                    </span>
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
          {models.length === 0 && !isLoading && (
            <span className="text-muted-foreground text-xs">
              No models found. Pull a model first.
            </span>
          )}
        </div>

        <div className="relative flex items-end gap-2">
          <div className="relative flex-1">
            <Textarea
              className="max-h-50 min-h-12 resize-none bg-input/50 py-3 pr-12"
              disabled={disabled || !selectedModel || isGenerating}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={
                selectedModel ? "Type a message..." : "Select a model first"
              }
              ref={textareaRef}
              rows={1}
              value={input}
            />
          </div>

          {isGenerating ? (
            <Button
              className="shrink-0"
              onClick={onStop}
              size="icon"
              variant="destructive"
            >
              <IconSquare className="size-4" />
              <span className="sr-only">Stop generation</span>
            </Button>
          ) : (
            <Button
              className="shrink-0"
              disabled={!input.trim() || !selectedModel || disabled}
              onClick={handleSubmit}
              size="icon"
            >
              <IconSend className="size-4" />
              <span className="sr-only">Send message</span>
            </Button>
          )}
        </div>

        <p className="mt-4 text-center text-muted-foreground text-xs">
          Press Enter to send, Shift+Enter for new line
        </p>
      </div>
    </div>
  )
}
