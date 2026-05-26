"use client"

import { IconClock, IconCpu, IconTopologyBus } from "@tabler/icons-react"
import { formatDistanceToNow } from "date-fns"

import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import type { OllamaRunningModel } from "@/lib/ollama/client"

function formatSize(bytes: number): string {
  const gb = bytes / (1024 * 1024 * 1024)
  if (gb >= 1) return `${gb.toFixed(1)} GB`
  const mb = bytes / (1024 * 1024)
  return `${mb.toFixed(0)} MB`
}

interface RunningModelsProps {
  models: OllamaRunningModel[]
}

export function RunningModels({ models }: RunningModelsProps) {
  if (models.length === 0) return null

  return (
    <Card className="border-primary/30 bg-primary/5">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <div className="flex size-8 items-center justify-center rounded-md bg-primary/20">
            <IconCpu className="size-4 text-primary" />
          </div>
          <div>
            <CardTitle className="text-base">Running Models</CardTitle>
            <CardDescription className="text-xs">
              {models.length} model{models.length !== 1 ? "s" : ""} currently
              loaded in memory
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col gap-3">
          {models.map((model) => (
            <div
              className="flex flex-wrap items-center gap-3 rounded-md bg-background/50 px-3 py-2"
              key={model.digest}
            >
              <span className="font-medium font-mono text-sm">
                {model.name}
              </span>

              <div className="flex flex-wrap items-center gap-2">
                {model.size_vram > 0 && (
                  <Badge
                    className="gap-1 font-normal text-xs"
                    variant="secondary"
                  >
                    <IconTopologyBus className="size-3 rotate-180" />
                    {formatSize(model.size_vram)} VRAM
                  </Badge>
                )}

                <Badge className="gap-1 font-normal text-xs" variant="outline">
                  <IconClock className="size-3" />
                  Expires{" "}
                  {formatDistanceToNow(new Date(model.expires_at), {
                    addSuffix: true,
                  })}
                </Badge>

                {model.details.parameter_size && (
                  <Badge className="font-normal text-xs" variant="outline">
                    {model.details.parameter_size}
                  </Badge>
                )}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
