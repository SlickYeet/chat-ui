import { Header } from "@/components/layout/header"
import { ModelList } from "@/components/models/model-list"
import { ScrollArea } from "@/components/ui/scroll-area"

export default function Page() {
  return (
    <div className="flex h-svh flex-col">
      <Header title="Models" />
      <main className="flex-1 overflow-hidden">
        <ScrollArea className="h-full">
          <div className="container max-w-6xl p-6">
            <ModelList />
          </div>
        </ScrollArea>
      </main>
    </div>
  )
}
