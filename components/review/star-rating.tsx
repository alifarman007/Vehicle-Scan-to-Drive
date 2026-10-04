"use client"

import { cn } from "cn"
import { Star } from "lucide-react"
import { useRef, useState } from "react"

import { STAR_VALUES } from "@/components/review/stars"
import { strings } from "@/lib/strings"

/**
 * Five big stars as a radio group: tap to rate, arrow keys to change. Stars up
 * to the rating fill amber and the tapped one pops.
 */
export function StarRating({
  value,
  onChange,
  labelledBy,
  className,
}: {
  value: number
  onChange: (rating: number) => void
  labelledBy?: string
  className?: string
}) {
  const buttons = useRef<(HTMLButtonElement | null)[]>([])
  // Bumped on every pick: used as the icon's key, so the pop replays even on the same star.
  const [pop, setPop] = useState({ star: 0, count: 0 })

  function pick(star: number) {
    onChange(star)
    setPop((p) => ({ star, count: p.count + 1 }))
  }

  function onKeyDown(e: React.KeyboardEvent) {
    let next = 0
    if (e.key === "ArrowRight" || e.key === "ArrowDown") next = Math.min(5, value + 1)
    else if (e.key === "ArrowLeft" || e.key === "ArrowUp") next = Math.max(1, value - 1)
    else if (e.key === "Home") next = 1
    else if (e.key === "End") next = 5
    if (!next) return
    e.preventDefault()
    pick(next)
    buttons.current[next - 1]?.focus()
  }

  return (
    <div
      role="radiogroup"
      aria-labelledby={labelledBy}
      onKeyDown={onKeyDown}
      className={cn("flex items-center justify-center gap-1", className)}
    >
      {STAR_VALUES.map((star) => {
        const checked = value === star
        const popping = pop.star === star && pop.count > 0
        return (
          <button
            key={star}
            ref={(el) => {
              buttons.current[star - 1] = el
            }}
            type="button"
            role="radio"
            aria-checked={checked}
            aria-label={strings.review.starLabel(star)}
            // Roving focus: Tab lands on the chosen star (or the first one).
            tabIndex={checked || (value === 0 && star === 1) ? 0 : -1}
            onClick={() => pick(star)}
            className="grid size-14 place-items-center rounded-full outline-none transition-transform duration-150 focus-visible:ring-4 focus-visible:ring-ring/30 active:scale-90"
          >
            <Star
              key={popping ? pop.count : 0}
              aria-hidden
              strokeWidth={1.5}
              className={cn(
                "size-11 transition-[color,fill] duration-150",
                star <= value ? "fill-warning text-warning" : "fill-transparent text-input",
                popping && "animate-pop"
              )}
            />
          </button>
        )
      })}
    </div>
  )
}
