"use client"

import { IconCircle, IconServer2 } from "@tabler/icons-react"

import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { api } from "@/lib/api/client"
import { cn } from "@/lib/utils"

interface HeaderProps {
  title?: string
}

export function Header({ title }: HeaderProps) {
  const [systemHealth] = api.system.health.useSuspenseQuery(undefined, {
    refetchInterval: 10000,
  })
  const [runningModels] = api.models.running.useSuspenseQuery(undefined, {
    refetchInterval: 5000,
  })

  const isConnected = systemHealth.status === "connected"
  const runningCount = runningModels.models.length

  return (
    <header className="flex h-(--header-height) items-center gap-4 border-border border-b bg-card/50 px-4">
      <SidebarTrigger />
      <Separator className="h-full" orientation="vertical" />

      {title && <h1 className="font-semibold text-lg">{title}</h1>}

      <div className="flex-1" />

      <div className="flex items-center gap-3">
        {runningCount > 0 && (
          <Badge className="gap-1.5" variant="secondary">
            <IconServer2 className="size-3" />
            {runningCount} model{runningCount !== 1 ? "s" : ""} loaded
          </Badge>
        )}

        <div className="relative flex items-center gap-1.5 text-xs">
          <IconCircle
            className={cn(
              "absolute size-2",
              isConnected
                ? "fill-green-500 text-green-500"
                : "fill-destructive text-destructive",
            )}
          />
          <IconCircle
            className={cn(
              "size-2 animate-ping",
              isConnected
                ? "fill-green-500 text-green-500"
                : "fill-destructive text-destructive",
            )}
          />
          <span className="text-muted-foreground">
            {isConnected ? "Connected" : "Disconnected"}
          </span>
        </div>
      </div>
    </header>
  )
}
