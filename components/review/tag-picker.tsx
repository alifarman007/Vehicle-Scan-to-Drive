"use client"

import { cn } from "cn"
import { useId } from "react"

import { tagChipClass } from "@/components/review/tag-chip"
import { tagsForRating, type ReviewTag } from "@/lib/review"
import { strings } from "@/lib/strings"

const t = strings.review

/**
 * Quick tags for the chosen rating (4–5 stars: what went well, 1–3: what
 * went wrong). Multi-select chips; the parent clears them when the group flips.
 */
export function TagPicker({
  rating,
  value,
  onChange,
  className,
}: {
  rating: number
  value: readonly ReviewTag[]
  onChange: (tags: ReviewTag[]) => void
  className?: string
}) {
  const titleId = useId()
  const tone = rating >= 4 ? "positive" : "negative"

  function toggle(tag: ReviewTag) {
    onChange(value.includes(tag) ? value.filter((v) => v !== tag) : [...value, tag])
  }

  return (
    <div role="group" aria-labelledby={titleId} className={className}>
      <p id={titleId} className="text-[16px] font-semibold">
        {t.tagsTitle[tone]}
      </p>
      <div className="mt-3 flex flex-wrap justify-center gap-2">
        {tagsForRating(rating).map((tag) => {
          const selected = value.includes(tag)
          return (
            <button
              key={tag}
              type="button"
              aria-pressed={selected}
              onClick={() => toggle(tag)}
              className={cn(
                tagChipClass({ tone, selected }),
                // Chips look 40px tall; the ::after stretches the tap target to 48px.
                "relative outline-none transition-[background-color,border-color,color,box-shadow,scale] duration-150 select-none after:absolute after:-inset-1 focus-visible:ring-4 focus-visible:ring-ring/30 active:scale-[0.96]"
              )}
            >
              {t.tags[tag]}
            </button>
          )
        })}
      </div>
    </div>
  )
}
