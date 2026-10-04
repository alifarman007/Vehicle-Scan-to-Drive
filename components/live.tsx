"use client"

import { cn } from "cn"

import { useNow } from "@/lib/clock"
import { formatTimeWithSeconds, formatTimer } from "@/lib/format"
import { strings } from "@/lib/strings"

/** Pulsing green dot for anything live. */
export function LiveDot({ className }: { className?: string }) {
  return (
    <span aria-hidden className={cn("relative inline-flex size-2.5 shrink-0", className)}>
      <span className="absolute inset-0 animate-live rounded-full bg-live" />
      <span className="relative inline-flex size-full rounded-full bg-live" />
    </span>
  )
}

export function OnTripBadge({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-2 rounded-full bg-success-soft px-3 py-1.5 text-[13px] font-semibold text-success-strong",
        className
      )}
    >
      <LiveDot />
      {strings.passenger.onTrip}
    </span>
  )
}

/** Ticking HH:MM:SS since `startedAt`, on server time. */
export function LiveTimer({
  startedAt,
  renderedAt,
  className,
}: {
  startedAt: string
  renderedAt: number
  className?: string
}) {
  const now = useNow(renderedAt)
  return (
    <span className={cn("font-mono tabular-nums", className)} role="timer">
      {formatTimer(now - Date.parse(startedAt))}
    </span>
  )
}

/** Live wall clock on server time, e.g. "10:42:05 AM". */
export function LiveClock({ renderedAt, className }: { renderedAt: number; className?: string }) {
  const now = useNow(renderedAt)
  return <span className={cn("tabular-nums", className)}>{formatTimeWithSeconds(now)}</span>
}
