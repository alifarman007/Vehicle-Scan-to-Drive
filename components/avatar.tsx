import { cn } from "cn"

import { initials } from "@/lib/format"

const SIZES = {
  sm: "size-10 text-[14px]",
  md: "size-10 text-[15px]",
  lg: "size-14 text-[19px]",
  xl: "size-20 text-[26px]",
} as const

export function Avatar({
  name,
  size = "md",
  tone = "solid",
  className,
}: {
  name: string
  size?: keyof typeof SIZES
  tone?: "solid" | "muted"
  className?: string
}) {
  return (
    <span
      aria-hidden
      className={cn(
        "grid shrink-0 place-items-center rounded-full font-semibold tracking-tight",
        tone === "solid" ? "bg-primary text-primary-foreground" : "bg-accent text-foreground",
        SIZES[size],
        className
      )}
    >
      {initials(name)}
    </span>
  )
}
