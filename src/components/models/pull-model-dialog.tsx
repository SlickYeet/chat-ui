"use client"

import {
  IconAlertCircle,
  IconCircleCheck,
  IconDownload,
} from "@tabler/icons-react"
import * as React from "react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Progress } from "@/components/ui/progress"
import { api } from "@/lib/api/client"
import type { PullProgress } from "@/server/api/routers/models"

type PullState = "idle" | "pulling" | "complete" | "error"

interface PullModelDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function PullModelDialog({ open, onOpenChange }: PullModelDialogProps) {
  const utils = api.useUtils()

  const [modelName, setModelName] = React.useState("")
  const [submittedModel, setSubmittedModel] = React.useState<string | null>(
    null,
  )
  const [error, setError] = React.useState<string | null>(null)
  const [pullState, setPullState] = React.useState<PullState>("idle")
  const [progress, setProgress] = React.useState<PullProgress | null>(null)

  const resetState = React.useCallback(() => {
    setModelName("")
    setSubmittedModel(null)
    setPullState("idle")
    setProgress(null)
    setError(null)
  }, [])

  const handleClose = React.useCallback(() => {
    if (pullState !== "pulling") {
      resetState()
      onOpenChange(false)
    }
  }, [pullState, onOpenChange, resetState])

  const handlePull = React.useCallback(() => {
    const model = modelName.trim()
    if (!model) return

    setPullState("pulling")
    setProgress(null)
    setError(null)
    setSubmittedModel(model)
  }, [modelName])

  api.models.pull.useSubscription(
    {
      model: submittedModel ?? "",
    },
    {
      enabled: pullState === "pulling" && submittedModel !== null,
      onData(data) {
        setProgress(data)

        if (data.status.startsWith("Error:")) {
          setPullState("error")
          setError(data.status)
        } else if (data.status === "success") {
          setPullState("complete")
          void utils.models.list.invalidate()
          toast.success(`Successfully pulled ${submittedModel}`)
        }
      },
      onError(err) {
        setPullState("error")
        setError(err.message)
      },
    },
  )

  const suggestedModels = [
    { desc: "Latest Llama 3.2", name: "llama3.2" },
    { desc: "Mistral 7B", name: "mistral" },
    { desc: "Code Llama", name: "codellama" },
    { desc: "Microsoft Phi-3", name: "phi3" },
  ]

  return (
    <Dialog onOpenChange={handleClose} open={open}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <IconDownload className="size-5" />
            Pull Model
          </DialogTitle>
          <DialogDescription>
            Download a model from the Ollama library
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4 py-4">
          <div className="flex gap-2">
            <Input
              className="font-mono"
              disabled={pullState === "pulling"}
              onChange={(e) => setModelName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && modelName.trim()) {
                  handlePull()
                }
              }}
              placeholder="e.g., llama3.2, mistral:7b"
              value={modelName}
            />
          </div>

          {pullState === "idle" && (
            <div>
              <p className="mb-2 text-muted-foreground text-xs">
                Popular models:
              </p>
              <div className="flex flex-wrap gap-2">
                {suggestedModels.map((model) => (
                  <Button
                    className="h-7 gap-1 text-xs"
                    key={model.name}
                    onClick={() => setModelName(model.name)}
                    size="sm"
                    variant="outline"
                  >
                    {model.name}
                  </Button>
                ))}
              </div>
            </div>
          )}

          {pullState !== "idle" && progress && (
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">{progress.status}</span>
                {progress.percent !== undefined && (
                  <span className="font-mono text-xs">{progress.percent}%</span>
                )}
              </div>

              {progress.percent !== undefined && (
                <Progress className="h-2" value={progress.percent} />
              )}

              {progress.completed !== undefined &&
                progress.total !== undefined && (
                  <p className="text-muted-foreground text-xs">
                    {formatBytes(progress.completed)} /{" "}
                    {formatBytes(progress.total)}
                  </p>
                )}
            </div>
          )}

          {pullState === "complete" && (
            <div className="flex items-center gap-2 rounded-md bg-success/10 px-3 py-2 text-sm text-success">
              <IconCircleCheck className="size-4" />
              Model pulled successfully!
            </div>
          )}

          {pullState === "error" && error && (
            <div className="flex items-center gap-2 rounded-md bg-destructive/10 px-3 py-2 text-destructive text-sm">
              <IconAlertCircle className="size-4" />
              {error}
            </div>
          )}
        </div>

        <DialogFooter>
          {pullState === "idle" ? (
            <>
              <Button onClick={handleClose} variant="outline">
                Cancel
              </Button>
              <Button disabled={!modelName.trim()} onClick={handlePull}>
                <IconDownload />
                Pull
              </Button>
            </>
          ) : pullState === "pulling" ? (
            <Button disabled variant="outline">
              Pulling...
            </Button>
          ) : (
            <Button onClick={handleClose}>Done</Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  if (bytes < 1024 * 1024 * 1024)
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`
}
