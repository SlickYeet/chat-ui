import React from "react"
import TextareaAutosize, {
  type TextareaAutosizeProps,
} from "react-textarea-autosize"

import { cn } from "@/lib/utils"

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaAutosizeProps>(
  ({ className, ...props }, ref) => {
    return (
      <TextareaAutosize
        className={cn(
          "field-sizing-content flex min-h-16 w-full resize-none rounded-none border border-transparent border-b-input bg-transparent px-0 py-3 text-base outline-none transition-[color,border-color] placeholder:text-muted-foreground focus-visible:border-b-ring disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-b-destructive md:text-sm dark:aria-invalid:border-b-destructive/50",
          className,
        )}
        data-slot="textarea"
        ref={ref}
        {...props}
      />
    )
  },
)

Textarea.displayName = "Textarea"

export { Textarea }
