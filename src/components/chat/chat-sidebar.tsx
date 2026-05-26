"use client"

import { IconDots, IconMessage, IconPlus, IconTrash } from "@tabler/icons-react"

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { ScrollArea } from "@/components/ui/scroll-area"
import { useChatStore } from "@/lib/store/chat-store"
import { cn } from "@/lib/utils"

interface ChatSidebarProps {
  className?: string
}

export function ChatSidebar({ className }: ChatSidebarProps) {
  const {
    conversations,
    activeConversationId,
    selectedModel,
    setActiveConversation,
    createConversation,
    deleteConversation,
  } = useChatStore()

  function handleNewChat() {
    if (selectedModel) {
      createConversation(selectedModel)
    }
  }

  return (
    <div className={cn("flex h-full flex-col", className)}>
      <div className="p-3">
        <Button
          className="w-full justify-start gap-2"
          disabled={!selectedModel}
          onClick={handleNewChat}
          variant="outline"
        >
          <IconPlus className="size-4" />
          New Chat
        </Button>
      </div>

      <ScrollArea className="flex-1 px-3">
        <div className="flex flex-col gap-1 pb-4">
          {conversations.length === 0 ? (
            <div className="px-2 py-8 text-center text-muted-foreground text-sm">
              <IconMessage className="mx-auto mb-2 size-8 opacity-50" />
              <p>No conversations yet</p>
            </div>
          ) : (
            conversations.map((conversation) => (
              <ConversationItem
                conversation={conversation}
                isActive={conversation.id === activeConversationId}
                key={conversation.id}
                onDelete={() => deleteConversation(conversation.id)}
                onSelect={() => setActiveConversation(conversation.id)}
              />
            ))
          )}
        </div>
      </ScrollArea>
    </div>
  )
}

interface ConversationItemProps {
  conversation: {
    id: string
    title: string
    model: string
    messages: { id: string }[]
    updatedAt: number
  }
  isActive: boolean
  onSelect: () => void
  onDelete: () => void
}

function ConversationItem({
  conversation,
  isActive,
  onSelect,
  onDelete,
}: ConversationItemProps) {
  return (
    <div
      className={cn(
        "group relative flex items-center gap-2 rounded-md px-2 py-2 text-sm transition-colors",
        isActive
          ? "bg-accent text-accent-foreground"
          : "text-foreground/80 hover:bg-accent/50 hover:text-foreground",
      )}
    >
      <button
        className="flex min-w-0 flex-1 items-center gap-2 text-left"
        onClick={onSelect}
        type="button"
      >
        <IconMessage className="size-4 shrink-0 opacity-70" />

        <div className="min-w-0 flex-1">
          <p className="truncate font-medium">{conversation.title}</p>
          <p className="truncate text-muted-foreground text-xs">
            {conversation.model} · {conversation.messages.length} messages
          </p>
        </div>
      </button>

      <AlertDialog>
        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <Button
                className={cn(
                  "size-7 shrink-0 opacity-0 transition-opacity",
                  "group-hover:opacity-100",
                  isActive && "opacity-100",
                )}
                onClick={(e) => e.stopPropagation()}
                size="icon"
                variant="ghost"
              />
            }
          >
            <IconDots className="size-4" />
            <span className="sr-only">More options</span>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-40">
            <DropdownMenuGroup>
              <AlertDialogTrigger
                nativeButton={false}
                render={
                  <DropdownMenuItem className="text-destructive focus:text-destructive" />
                }
              >
                <IconTrash className="size-4" />
                Delete
              </AlertDialogTrigger>
            </DropdownMenuGroup>
          </DropdownMenuContent>
        </DropdownMenu>

        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete conversation?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete &quot;{conversation.title}&quot; and
              all its messages. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={(e) => {
                e.stopPropagation()
                onDelete()
              }}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
