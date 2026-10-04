import { cn } from "cn"
import { Star } from "lucide-react"

import { strings } from "@/lib/strings"

const SIZES = {
  sm: "size-4",
  md: "size-5",
  lg: "size-7",
} as const

export const STAR_VALUES = [1, 2, 3, 4, 5] as const

/** A rating shown read-only, e.g. ★★★★☆. Filled stars are amber. */
export function Stars({
  rating,
  size = "md",
  className,
}: {
  rating: number
  size?: keyof typeof SIZES
  className?: string
}) {
  return (
    <span
      role="img"
      aria-label={strings.review.starLabel(rating)}
      className={cn("inline-flex items-center gap-0.5", className)}
    >
      {STAR_VALUES.map((n) => (
        <Star
          key={n}
          aria-hidden
          strokeWidth={1.5}
          className={cn(SIZES[size], n <= rating ? "fill-warning text-warning" : "fill-accent text-rule")}
        />
      ))}
    </span>
  )
}
