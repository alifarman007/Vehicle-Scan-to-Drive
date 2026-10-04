import { cn } from "cn"

import { POSITIVE_TAGS, type ReviewTag } from "@/lib/review"
import { strings } from "@/lib/strings"

export type TagTone = "positive" | "negative"

/** "Went well" tags read emerald, "went wrong" ones rose. */
export function tagTone(tag: string): TagTone {
  return (POSITIVE_TAGS as readonly string[]).includes(tag) ? "positive" : "negative"
}

/** Friendly label for a stored tag key (falls back to the key if it's unknown). */
export function tagLabel(tag: string): string {
  const labels: Record<string, string | undefined> = strings.review.tags
  return labels[tag] ?? tag
}

export function tagChipClass({ tone, selected }: { tone: TagTone; selected: boolean }) {
  return cn(
    "inline-flex h-10 items-center rounded-full text-[15px] font-medium whitespace-nowrap",
    // Selected chips get a 2px border that's easy to spot in sunlight; the
    // padding shrinks by the same 1px so the chips never reflow on tap.
    selected
      ? cn(
          "border-2 px-[15px]",
          tone === "positive"
            ? "border-success bg-success-soft text-success-strong"
            : "border-destructive bg-destructive-soft text-destructive-strong"
        )
      : "border border-border bg-card px-4 text-foreground shadow-card"
  )
}

/** A chosen tag, read-only (e.g. in "Your rating"). */
export function TagChip({ tag, className }: { tag: ReviewTag | string; className?: string }) {
  return (
    <span className={cn(tagChipClass({ tone: tagTone(tag), selected: true }), "h-8 border px-3 text-[14px]", className)}>
      {tagLabel(tag)}
    </span>
  )
}
