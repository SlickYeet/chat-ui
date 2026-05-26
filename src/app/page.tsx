import { ChatPanel } from "@/components/chat/chat-panel"
import { Header } from "@/components/layout/header"
import { api, HydrateClient } from "@/lib/api/server"

export default function HomePage() {
  void api.system.health.prefetch()
  void api.models.running.prefetch()

  return (
    <HydrateClient>
      <div className="flex size-full h-svh flex-col">
        <Header title="Chat" />
        <main className="flex-1 overflow-hidden">
          <ChatPanel />
        </main>
      </div>
    </HydrateClient>
  )
}
