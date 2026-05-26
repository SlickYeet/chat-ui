import { Header } from "@/components/layout/header"
import { ModelList } from "@/components/models/model-list"
import { ScrollArea } from "@/components/ui/scroll-area"
import { api, HydrateClient } from "@/lib/api/server"

export default function Page() {
  void api.models.list.prefetch()
  void api.models.running.prefetch()

  return (
    <HydrateClient>
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
    </HydrateClient>
  )
}
