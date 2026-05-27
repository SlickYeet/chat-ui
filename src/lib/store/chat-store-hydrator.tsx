"use client"

import * as React from "react"

import { useChatStore } from "@/lib/store/chat-store"

export function ChatStoreHydrator() {
  React.useEffect(() => {
    try {
      const raw = localStorage.getItem("ollama-chat-store")
      if (!raw) return

      const parsed = JSON.parse(raw) as {
        state?: Partial<ReturnType<typeof useChatStore.getState>>
      }

      if (parsed.state) {
        useChatStore.setState(parsed.state)
      }
    } catch {
      // Ignore malformed storage and keep the default in-memory state.
    }
  }, [])

  return null
}
