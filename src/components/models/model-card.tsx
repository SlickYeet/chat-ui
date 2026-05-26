"use client"

import {
  IconDatabase,
  IconInfoCircle,
  IconPlayerPlay,
  IconStackFront,
  IconTrash,
} from "@tabler/icons-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import type { OllamaModel } from "@/lib/ollama/client"
import { cn } from "@/lib/utils"

function formatSize(bytes: number): string {
  const gb = bytes / (1024 * 1024 * 1024)
  if (gb >= 1) return `${gb.toFixed(1)} GB`
  const mb = bytes / (1024 * 1024)
  return `${mb.toFixed(0)} MB`
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr)
  return date.toLocaleDateString("en-US", {
    day: "numeric",
    month: "short",
    year: "numeric",
  })
}

interface ModelCardProps {
  model: OllamaModel
  isRunning?: boolean
  onSelect?: () => void
  onDelete?: () => void
  onShowDetails?: () => void
}

export function ModelCard({
  model,
  isRunning,
  onSelect,
  onDelete,
  onShowDetails,
}: ModelCardProps) {
  const details = model.details

  return (
    <Card
      className={cn(
        "transition-colors",
        isRunning && "border-primary/50 bg-primary/5",
      )}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <CardTitle className="flex items-center gap-2 truncate font-mono text-base">
              {model.name}
              {isRunning && (
                <Badge className="shrink-0 text-xs" variant="default">
                  Running
                </Badge>
              )}
            </CardTitle>
            <CardDescription className="mt-1 text-xs">
              {details.family && (
                <span className="capitalize">{details.family}</span>
              )}
              {details.parameter_size && (
                <span> · {details.parameter_size}</span>
              )}
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pb-3">
        <div className="flex flex-wrap gap-2">
          <Tooltip>
            <TooltipTrigger
              render={
                <Badge
                  className="gap-1 font-normal text-xs"
                  variant="secondary"
                />
              }
            >
              <IconDatabase className="size-3" />
              {formatSize(model.size)}
            </TooltipTrigger>
            <TooltipContent>Model size on disk</TooltipContent>
          </Tooltip>

          {details.quantization_level && (
            <Tooltip>
              <TooltipTrigger
                render={
                  <Badge
                    className="gap-1 font-normal text-xs"
                    variant="outline"
                  />
                }
              >
                <IconStackFront className="size-3" />
                {details.quantization_level}
              </TooltipTrigger>
              <TooltipContent>Quantization level</TooltipContent>
            </Tooltip>
          )}

          {details.format && (
            <Badge className="font-normal text-xs" variant="outline">
              {details.format}
            </Badge>
          )}
        </div>

        <p className="mt-3 text-muted-foreground text-xs">
          Modified: {formatDate(model.modified_at)}
        </p>
      </CardContent>

      <CardFooter className="gap-2 pt-0">
        <Button
          className="flex-1 gap-1.5"
          onClick={onSelect}
          size="sm"
          variant="default"
        >
          <IconPlayerPlay className="size-3" />
          Use
        </Button>

        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger
              render={
                <Button
                  className="size-8"
                  onClick={onShowDetails}
                  size="icon"
                  variant="outline"
                />
              }
            >
              <IconInfoCircle className="size-4" />
              <span className="sr-only">Model details</span>
            </TooltipTrigger>
            <TooltipContent>View details</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger
              render={
                <Button
                  className="size-8 text-destructive hover:bg-destructive/10 hover:text-destructive"
                  onClick={onDelete}
                  size="icon"
                  variant="outline"
                />
              }
            >
              <IconTrash className="size-4" />
              <span className="sr-only">Delete model</span>
            </TooltipTrigger>
            <TooltipContent>Delete model</TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </CardFooter>
    </Card>
  )
}
