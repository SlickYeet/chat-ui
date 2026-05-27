import { ChatPanel } from "@/components/chat/chat-panel"
import { Header } from "@/components/layout/header"

export default function HomePage() {
  return (
    <div className="flex size-full h-svh flex-col">
      <Header title="Chat" />
      <main className="flex-1 overflow-hidden">
        <ChatPanel />
      </main>
    </div>
  )
}
