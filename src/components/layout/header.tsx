"use client"

import { IconCircle, IconServer2 } from "@tabler/icons-react"
import * as React from "react"

import { Separator } from "@/components/ui/separator"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { api } from "@/lib/api/client"
import { cn } from "@/lib/utils"

interface HeaderProps {
  title?: string
}

export function Header({ title }: HeaderProps) {
  const [isMounted, setIsMounted] = React.useState(false)

  React.useEffect(() => {
    setIsMounted(true)
  }, [])

  const { data: systemHealth } = api.system.health.useQuery(undefined, {
    enabled: isMounted,
    refetchInterval: isMounted ? 10000 : false,
  })
  const { data: runningModels } = api.models.running.useQuery(undefined, {
    enabled: isMounted,
    refetchInterval: isMounted ? 5000 : false,
  })

  const isConnected = systemHealth?.status === "connected"
  const runningCount = runningModels?.models.length ?? 0

  return (
    <header className="flex h-(--header-height) items-center gap-4 border-b bg-card/60 px-6">
      <SidebarTrigger />
      <Separator className="h-full" orientation="vertical" />

      {title && <h1 className="font-semibold text-lg">{title}</h1>}

      <div className="flex-1" />

      <div className="flex items-center gap-3">
        {runningCount > 0 && (
          <p className="flex items-center gap-1.5 text-muted-foreground text-xs">
            <IconServer2 className="size-3.5" />
            {runningCount} model{runningCount !== 1 ? "s" : ""} loaded
          </p>
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
