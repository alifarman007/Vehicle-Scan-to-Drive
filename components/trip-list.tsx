"use client"

import { ChevronRight, History } from "lucide-react"
import Link from "next/link"

import { Avatar } from "@/components/avatar"
import { EmptyState } from "@/components/empty-state"
import { LiveDot } from "@/components/live"
import { formatDay, formatDuration, formatTime, formatTimeRange } from "@/lib/format"
import { strings } from "@/lib/strings"
import type { Trip } from "@/lib/types"

/** Recent trips, newest first. Each row opens the trip details. */
export function TripList({ trips, renderedAt }: { trips: Trip[]; renderedAt: number }) {
  if (trips.length === 0) {
    return <EmptyState icon={History} title={strings.recent.emptyTitle} body={strings.recent.emptyBody} />
  }
  return (
    <ul className="divide-y divide-border overflow-hidden rounded-2xl border bg-card shadow-card">
      {trips.map((trip) => (
        <TripRow key={trip.id} trip={trip} renderedAt={renderedAt} />
      ))}
    </ul>
  )
}

function TripRow({ trip, renderedAt }: { trip: Trip; renderedAt: number }) {
  const other = trip.viewerRole === "driver" ? trip.passenger.name : trip.driver.name
  const day = formatDay(trip.startedAt, renderedAt, {
    today: strings.common.today,
    yesterday: strings.common.yesterday,
  })
  const time = trip.endedAt ? formatTimeRange(trip.startedAt, trip.endedAt) : formatTime(trip.startedAt)

  return (
    <li>
      <Link
        href={`/trips/${trip.id}`}
        draggable={false}
        onContextMenu={(e) => e.preventDefault()}
        className="flex min-h-[72px] touch-callout-none items-center gap-3 px-4 py-3 transition-colors select-none active:bg-muted"
      >
        <Avatar name={other} size="sm" tone="muted" />
        <div className="min-w-0 flex-1">
          <div className="flex items-baseline justify-between gap-3">
            <p className="min-w-0 truncate text-[16px] font-semibold">{other}</p>
            {trip.status === "active" ? (
              <span className="inline-flex shrink-0 items-center gap-1.5 text-[13px] font-semibold text-success-strong">
                <LiveDot className="size-2" />
                {strings.recent.active}
              </span>
            ) : trip.endedAt ? (
              <span className="shrink-0 text-[14px] font-medium text-muted-foreground tabular-nums">
                {formatDuration(Date.parse(trip.endedAt) - Date.parse(trip.startedAt))}
              </span>
            ) : null}
          </div>
          {/* Never truncated: the times are the point of a verified trip log. */}
          <p className="text-[14px] text-muted-foreground tabular-nums">
            {day} · {time}
          </p>
        </div>
        <ChevronRight className="size-5 shrink-0 text-subtle-foreground" aria-hidden />
      </Link>
    </li>
  )
}
