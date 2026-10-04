import { cn } from "cn"
import type { LucideIcon } from "lucide-react"

/** Friendly empty state: an icon and one line. */
export function EmptyState({
  icon: Icon,
  title,
  body,
  className,
}: {
  icon: LucideIcon
  title: string
  body?: string
  className?: string
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center rounded-2xl border border-dashed border-rule px-6 py-7 text-center",
        className
      )}
    >
      <span className="grid size-12 place-items-center rounded-full bg-card text-muted-foreground shadow-card">
        <Icon className="size-6" />
      </span>
      <p className="mt-3 text-[16px] font-semibold">{title}</p>
      {body ? <p className="mt-1 max-w-[32ch] text-[15px] text-pretty text-muted-foreground">{body}</p> : null}
    </div>
  )
}
