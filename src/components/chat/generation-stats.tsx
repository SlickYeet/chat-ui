"use client"

import {
  IconActivity,
  IconAlertCircle,
  IconBolt,
  IconCircleCheck,
  IconClock,
  IconHash,
  IconLoader2,
} from "@tabler/icons-react"

import { Badge } from "@/components/ui/badge"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import type { GenerationState } from "@/lib/store/chat-store"
import { useChatStore } from "@/lib/store/chat-store"
import { cn } from "@/lib/utils"

interface GenerationStatsProps {
  className?: string
  finalStats?: {
    totalDuration: number
    loadDuration: number
    promptEvalCount: number
    promptEvalDuration: number
    evalCount: number
    evalDuration: number
    tokensPerSecond: number
  }
}

function formatDuration(ns: number): string {
  const ms = ns / 1_000_000
  if (ms < 1000) return `${Math.round(ms)}ms`
  const sec = ms / 1000
  if (sec < 60) return `${sec.toFixed(1)}s`
  const min = Math.floor(sec / 60)
  const remainingSec = (sec % 60).toFixed(0)
  return `${min}m ${remainingSec}s`
}

function StatusIndicator({ status }: { status: GenerationState["status"] }) {
  const statusConfig = {
    complete: {
      color: "text-success",
      icon: <IconCircleCheck />,
      label: "Complete",
    },
    error: { color: "text-error", icon: <IconAlertCircle />, label: "Error" },
    generating: {
      color: "text-generating",
      icon: <IconActivity className="animate-pulse-soft" />,
      label: "Generating...",
    },
    idle: { color: "", icon: null, label: "" },
    loading: {
      color: "text-waiting",
      icon: <IconLoader2 className="animate-spin" />,
      label: "Loading model...",
    },
    waiting: {
      color: "text-waiting",
      icon: <IconLoader2 className="animate-spin" />,
      label: "Waiting...",
    },
  }

  const config = statusConfig[status]
  if (!config.icon) return null

  return (
    <div
      className={cn(
        "flex items-center gap-1.5 font-medium text-xs",
        config.color,
      )}
    >
      <span className="size-3.5">{config.icon}</span>
      <span>{config.label}</span>
    </div>
  )
}

export function GenerationStats({
  className,
  finalStats,
}: GenerationStatsProps) {
  const { generation } = useChatStore()

  if (generation.status === "idle" && !finalStats) return null

  if (finalStats) {
    return (
      <div
        className={cn("flex flex-wrap items-center gap-2 text-xs", className)}
      >
        <Tooltip>
          <TooltipTrigger
            render={<Badge className="gap-1 font-mono" variant="secondary" />}
          >
            <IconHash className="size-3" />
            {finalStats.evalCount} tokens
          </TooltipTrigger>
          <TooltipContent>
            <p>Response tokens generated</p>
          </TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger
            render={<Badge className="gap-1 font-mono" variant="secondary" />}
          >
            <IconBolt className="size-3" />
            {finalStats.tokensPerSecond.toFixed(1)} tok/s
          </TooltipTrigger>
          <TooltipContent>
            <p>Generation speed</p>
          </TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger
            render={<Badge className="gap-1 font-mono" variant="secondary" />}
          >
            <IconClock className="size-3" />
            {formatDuration(finalStats.totalDuration)}
          </TooltipTrigger>
          <TooltipContent className="max-w-xs">
            <div className="flex flex-col gap-1 text-xs">
              <div className="flex justify-between gap-4">
                <span className="text-muted-foreground">Total:</span>
                <span className="font-mono">
                  {formatDuration(finalStats.totalDuration)}
                </span>
              </div>
              {finalStats.loadDuration > 0 && (
                <div className="flex justify-between gap-4">
                  <span className="text-muted-foreground">Model load:</span>
                  <span className="font-mono">
                    {formatDuration(finalStats.loadDuration)}
                  </span>
                </div>
              )}
              <div className="flex justify-between gap-4">
                <span className="text-muted-foreground">Prompt eval:</span>
                <span className="font-mono">
                  {formatDuration(finalStats.promptEvalDuration)}
                </span>
              </div>
              <div className="flex justify-between gap-4">
                <span className="text-muted-foreground">Response eval:</span>
                <span className="font-mono">
                  {formatDuration(finalStats.evalDuration)}
                </span>
              </div>
            </div>
          </TooltipContent>
        </Tooltip>

        {finalStats.promptEvalCount > 0 && (
          <Tooltip>
            <TooltipTrigger
              render={
                <Badge
                  className="gap-1 font-mono text-muted-foreground"
                  variant="outline"
                />
              }
            >
              {finalStats.promptEvalCount} prompt tokens
            </TooltipTrigger>
            <TooltipContent>
              <p>Tokens in your prompt</p>
            </TooltipContent>
          </Tooltip>
        )}
      </div>
    )
  }

  return (
    <div className={cn("flex items-center gap-3 text-xs", className)}>
      <StatusIndicator status={generation.status} />

      {generation.status === "generating" && (
        <>
          <Badge className="gap-1 font-mono" variant="secondary">
            <IconHash className="size-3" />
            {generation.tokenCount}
          </Badge>

          {generation.tokensPerSecond > 0 && (
            <Badge className="gap-1 font-mono" variant="secondary">
              <IconBolt className="size-3" />
              {generation.tokensPerSecond.toFixed(1)} tok/s
            </Badge>
          )}

          {generation.elapsedMs > 0 && (
            <Badge
              className="gap-1 font-mono text-muted-foreground"
              variant="outline"
            >
              <IconClock className="size-3" />
              {(generation.elapsedMs / 1000).toFixed(1)}s
            </Badge>
          )}
        </>
      )}

      {generation.error && (
        <span className="text-error">{generation.error}</span>
      )}
    </div>
  )
}

export function StreamingIndicator() {
  return (
    <span className="ml-0.5 inline-block h-4 w-2 animate-blink bg-primary" />
  )
}
