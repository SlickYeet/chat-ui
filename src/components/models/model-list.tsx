"use client"

import { IconBox, IconDownload, IconRefresh } from "@tabler/icons-react"
import * as React from "react"
import { toast } from "sonner"

import { ModelCard } from "@/components/models/model-card"
import { ModelDetailsSheet } from "@/components/models/model-details-sheet"
import { PullModelDialog } from "@/components/models/pull-model-dialog"
import { RunningModels } from "@/components/models/running-models"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { api } from "@/lib/api/client"
import type { OllamaModel } from "@/lib/ollama/client"
import { useChatStore } from "@/lib/store/chat-store"
import { cn } from "@/lib/utils"

export function ModelList() {
  const utils = api.useUtils()

  const [isPullDialogOpen, setIsPullDialogOpen] = React.useState(false)
  const [modelToDelete, setModelToDelete] = React.useState<string | null>(null)
  const [selectedModel, setSelectedModel] = React.useState<OllamaModel | null>(
    null,
  )

  const { setSelectedModel: setChatModel, createConversation } = useChatStore()

  const [{ models }, { isLoading, refetch, isRefetching }] =
    api.models.list.useSuspenseQuery()

  const [{ models: runningModels }] = api.models.running.useSuspenseQuery()

  const deleteModel = api.models.delete.useMutation({
    onError(error) {
      toast.error(`Failed to delete model: ${error.message}`)
    },
    onSuccess() {
      void utils.models.list.invalidate()
      void utils.models.running.invalidate()
      toast.success("Model deleted")
      setModelToDelete(null)
    },
  })

  const runningModelNames = new Set(runningModels.map((m) => m.name))

  function handleSelectModel(model: OllamaModel) {
    setChatModel(model.name)
    createConversation(model.name)
    // TODO: Navigate to chat - this would be handled by parent in a real app
  }

  function handleDeleteModel() {
    if (modelToDelete) {
      deleteModel.mutate({
        model: modelToDelete,
      })
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-semibold text-2xl">Models</h1>
          <p className="text-muted-foreground text-sm">
            Manage your local Ollama models
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            className="gap-1.5"
            disabled={isRefetching}
            onClick={() => refetch()}
            size="sm"
            variant="outline"
          >
            <IconRefresh className={cn(isRefetching ? "animate-spin" : "")} />
            Refresh
          </Button>
          <Button
            className="gap-1.5"
            onClick={() => setIsPullDialogOpen(true)}
            size="sm"
          >
            <IconDownload />
            Pull Model
          </Button>
        </div>
      </div>

      {runningModels.length > 0 && <RunningModels models={runningModels} />}

      <div>
        <h2 className="mb-4 font-medium text-lg">Local Models</h2>

        {isLoading ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[...Array(6)].map((_, i) => (
              <Skeleton className="h-48 rounded-lg" key={i} />
            ))}
          </div>
        ) : models.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-12 text-center">
            <IconBox className="mb-4 size-12 text-muted-foreground/50" />
            <h3 className="font-medium text-lg">No models found</h3>
            <p className="mt-1 text-muted-foreground text-sm">
              Pull a model to get started
            </p>
            <Button
              className="mt-4 gap-1.5"
              onClick={() => setIsPullDialogOpen(true)}
            >
              <IconDownload />
              Pull Model
            </Button>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {models.map((model) => (
              <ModelCard
                isRunning={runningModelNames.has(model.name)}
                key={model.digest}
                model={model}
                onDelete={() => setModelToDelete(model.name)}
                onSelect={() => handleSelectModel(model)}
                onShowDetails={() => setSelectedModel(model)}
              />
            ))}
          </div>
        )}
      </div>

      <ModelDetailsSheet
        isOpen={!!selectedModel}
        model={selectedModel}
        onClose={() => setSelectedModel(null)}
      />

      <PullModelDialog
        onOpenChange={setIsPullDialogOpen}
        open={isPullDialogOpen}
      />

      <AlertDialog
        onOpenChange={(open) => !open && setModelToDelete(null)}
        open={!!modelToDelete}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete model?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete{" "}
              <span className="font-medium font-mono">{modelToDelete}</span>{" "}
              from your local storage. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={deleteModel.isPending}
              onClick={handleDeleteModel}
            >
              {deleteModel.isPending ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
