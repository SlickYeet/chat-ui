"use client"

import {
  IconCheck,
  IconCopy,
  IconDatabase,
  IconFileCode,
  IconStackFront,
} from "@tabler/icons-react"
import * as React from "react"
import { toast } from "sonner"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { Skeleton } from "@/components/ui/skeleton"
import { api } from "@/lib/api/client"
import type { OllamaModel } from "@/lib/ollama/client"

function formatSize(bytes: number): string {
  const gb = bytes / (1024 * 1024 * 1024)
  if (gb >= 1) return `${gb.toFixed(2)} GB`
  const mb = bytes / (1024 * 1024)
  return `${mb.toFixed(0)} MB`
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr)
  return date.toLocaleDateString("en-US", {
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    month: "long",
    year: "numeric",
  })
}

interface ModelDetailsSheetProps {
  model: OllamaModel | null
  isOpen: boolean
  onClose: () => void
}

function CopyButton({ text, label }: { text: string; label: string }) {
  const [copied, setCopied] = React.useState(false)

  async function handleCopy() {
    await navigator.clipboard.writeText(text)
    setCopied(true)
    toast.success(`${label} copied to clipboard`)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <Button className="size-6" onClick={handleCopy} size="icon" variant="ghost">
      {copied ? <IconCheck /> : <IconCopy />}
      <span className="sr-only">Copy {label}</span>
    </Button>
  )
}

export function ModelDetailsSheet({
  model,
  isOpen,
  onClose,
}: ModelDetailsSheetProps) {
  const modelName = model?.name ?? ""
  const { data: modelInfo, isLoading } = api.models.show.useQuery(
    { model: modelName },
    { enabled: Boolean(modelName) },
  )

  if (!model) return null

  return (
    <Sheet onOpenChange={(open) => !open && onClose()} open={isOpen}>
      <SheetContent className="w-full sm:max-w-lg">
        <SheetHeader>
          <SheetTitle className="font-mono">{model.name}</SheetTitle>
          <SheetDescription>
            Model information and configuration
          </SheetDescription>
        </SheetHeader>

        <ScrollArea className="h-[calc(100vh-120px)] px-4">
          <div className="flex flex-col gap-6 py-6">
            <section>
              <h3 className="mb-3 font-medium text-muted-foreground text-sm">
                Basic Information
              </h3>
              <div className="flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm">Size</span>
                  <Badge className="gap-1 font-mono" variant="secondary">
                    <IconDatabase className="size-3" />
                    {formatSize(model.size)}
                  </Badge>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm">Family</span>
                  <span className="font-medium text-sm capitalize">
                    {model.details.family || "Unknown"}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm">Parameters</span>
                  <span className="font-medium text-sm">
                    {model.details.parameter_size || "Unknown"}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm">Quantization</span>
                  <Badge className="gap-1 font-mono" variant="outline">
                    <IconStackFront className="size-3" />
                    {model.details.quantization_level || "None"}
                  </Badge>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm">Format</span>
                  <span className="font-medium text-sm">
                    {model.details.format || "Unknown"}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm">Modified</span>
                  <span className="text-muted-foreground text-sm">
                    {formatDate(model.modified_at)}
                  </span>
                </div>
              </div>
            </section>

            <Separator />

            <section>
              <h3 className="mb-3 font-medium text-muted-foreground text-sm">
                Digest
              </h3>
              <div className="flex items-center gap-2">
                <code className="flex-1 truncate rounded bg-muted px-2 py-1 font-mono text-xs">
                  {model.digest}
                </code>
                <CopyButton label="Digest" text={model.digest} />
              </div>
            </section>

            <Separator />

            {isLoading ? (
              <section>
                <h3 className="mb-3 font-medium text-muted-foreground text-sm">
                  Model Configuration
                </h3>
                <Skeleton className="h-32 w-full" />
              </section>
            ) : modelInfo ? (
              <>
                {modelInfo.parameters && (
                  <section>
                    <h3 className="mb-3 flex items-center justify-between font-medium text-muted-foreground text-sm">
                      Parameters
                      <CopyButton
                        label="Parameters"
                        text={modelInfo.parameters}
                      />
                    </h3>
                    <pre className="max-h-40 overflow-auto whitespace-pre-wrap rounded bg-muted p-3 font-mono text-xs">
                      {modelInfo.parameters}
                    </pre>
                  </section>
                )}

                {modelInfo.template && (
                  <>
                    <Separator />
                    <section>
                      <h3 className="mb-3 flex items-center justify-between font-medium text-muted-foreground text-sm">
                        <span className="flex items-center gap-1">
                          <IconFileCode className="size-4" />
                          Template
                        </span>
                        <CopyButton
                          label="Template"
                          text={modelInfo.template}
                        />
                      </h3>
                      <pre className="max-h-40 overflow-auto whitespace-pre-wrap rounded bg-muted p-3 font-mono text-xs">
                        {modelInfo.template}
                      </pre>
                    </section>
                  </>
                )}

                {modelInfo.model_info &&
                  Object.keys(modelInfo.model_info).length > 0 && (
                    <>
                      <Separator />
                      <section>
                        <h3 className="mb-3 font-medium text-muted-foreground text-sm">
                          Architecture Info
                        </h3>
                        <div className="flex flex-col gap-2">
                          {Object.entries(modelInfo.model_info)
                            .filter(
                              ([_, value]) =>
                                value !== null && value !== undefined,
                            )
                            .slice(0, 10)
                            .map(([key, value]) => (
                              <div
                                className="flex items-center justify-between text-sm"
                                key={key}
                              >
                                <span className="text-muted-foreground">
                                  {key.replace(/_/g, " ").replace(/\./g, " ")}
                                </span>
                                <span className="font-mono text-xs">
                                  {typeof value === "object"
                                    ? JSON.stringify(value)
                                    : String(value)}
                                </span>
                              </div>
                            ))}
                        </div>
                      </section>
                    </>
                  )}
              </>
            ) : null}
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  )
}
