import { cn } from "cn"

import { APP_NAME } from "@/lib/config"

/** App mark: a ticket with a check, white on near-black. */
export function LogoMark({ className }: { className?: string }) {
  return (
    <span
      aria-hidden
      className={cn(
        "inline-grid size-8 shrink-0 place-items-center rounded-[10px] bg-primary text-primary-foreground shadow-[inset_0_1px_0_rgb(255_255_255/0.12)]",
        className
      )}
    >
      <svg
        viewBox="0 0 24 24"
        className="size-[62%]"
        fill="none"
        stroke="currentColor"
        strokeWidth={2.2}
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M3.5 8A1.5 1.5 0 0 1 5 6.5h14A1.5 1.5 0 0 1 20.5 8v2.2a1.8 1.8 0 0 0 0 3.6V16a1.5 1.5 0 0 1-1.5 1.5H5A1.5 1.5 0 0 1 3.5 16v-2.2a1.8 1.8 0 0 0 0-3.6z" />
        <path d="m8.8 12.2 2.1 2.1 4.3-4.4" />
      </svg>
    </span>
  )
}

export function Wordmark({ className, small = false }: { className?: string; small?: boolean }) {
  return (
    <span className={cn("inline-flex items-center gap-2", className)}>
      <LogoMark className={small ? "size-7 rounded-[9px]" : undefined} />
      <span className={cn("font-semibold tracking-tight", small ? "text-[15px]" : "text-[17px]")}>{APP_NAME}</span>
    </span>
  )
}
