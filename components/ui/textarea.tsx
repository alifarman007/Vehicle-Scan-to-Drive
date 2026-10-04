import * as React from "react"
import { cn } from "cn"

function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        "flex field-sizing-content min-h-24 w-full rounded-2xl border border-input bg-card px-4 py-3 text-[17px] text-foreground shadow-[0_1px_2px_0_rgb(9_9_11/0.04)] transition-[border-color,box-shadow] outline-none placeholder:text-subtle-foreground/80 focus-visible:border-foreground/70 focus-visible:ring-4 focus-visible:ring-ring/15 disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-4 aria-invalid:ring-destructive/15",
        className
      )}
      {...props}
    />
  )
}

export { Textarea }
