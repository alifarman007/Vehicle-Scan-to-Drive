import { cn } from "cn"
import { ShieldCheck } from "lucide-react"

import { LiveDot, LiveTimer, OnTripBadge } from "@/components/live"
import { PlateChip } from "@/components/plate-chip"
import { formatDate, formatDateLong, formatDuration, formatTime, formatTimeRange } from "@/lib/format"
import { strings } from "@/lib/strings"
import type { Trip } from "@/lib/types"

const t = strings.receipt

/*
 * Torn-paper bottom edge: the card is solid down to the teeth, then a row of
 * 14×7px triangles (a 90° conic wedge per tile). A mask, not a border, so the
 * drop-shadow on the parent (pass-shadow) traces the zig-zag too.
 */
const TOOTH = 7
const PAPER_MASK = [
  `linear-gradient(#000 0 0) top / 100% calc(100% - ${TOOTH - 1}px) no-repeat`,
  `conic-gradient(from -45deg at 50% 100%, #000 90deg, #0000 0) bottom / ${TOOTH * 2}px ${TOOTH}px repeat-x`,
].join(", ")

/** White receipt paper with a zig-zag bottom edge. */
export function ReceiptPaper({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn("pass-shadow", className)}>
      <div className="rounded-t-3xl bg-card px-5 pt-5 pb-9" style={{ WebkitMask: PAPER_MASK, mask: PAPER_MASK }}>
        {children}
      </div>
    </div>
  )
}

function Rule({ className }: { className?: string }) {
  return <div aria-hidden className={cn("border-t border-dashed border-rule", className)} />
}

/**
 * A trip as a printed ride receipt: who you rode with, start → end, the
 * vehicle and the duration as the "total". Completed trips carry the
 * "Verified by both" stamp; running ones a live badge and ticking timer.
 */
export function TripReceipt({
  trip,
  renderedAt,
  className,
  compact = false,
}: {
  trip: Trip
  renderedAt: number
  className?: string
  /** Short form for the summary screen, so the rating stays on the first screen. */
  compact?: boolean
}) {
  if (compact && trip.endedAt) return <CompactReceipt trip={trip} endedAt={trip.endedAt} className={className} />
  const active = trip.status === "active"
  const driverView = trip.viewerRole === "driver"
  // The other person on the trip leads; the viewer's own side is a detail row.
  const other = driverView
    ? { label: t.passenger, name: trip.passenger.name }
    : { label: t.driver, name: trip.driver.name }
  const own = driverView ? { label: t.driver, name: trip.driver.name } : { label: t.passenger, name: trip.passenger.name }

  return (
    <ReceiptPaper className={className}>
      <article aria-label={t.tripNo(trip.tripNo)}>
        <header className="flex min-h-8 flex-wrap items-center justify-between gap-x-3 gap-y-2">
          <p className="font-mono text-[13px] font-semibold tracking-[0.1em] text-muted-foreground uppercase">
            {t.tripNo(trip.tripNo)}
          </p>
          {active ? <OnTripBadge /> : <VerifiedBadge />}
        </header>

        <div className="mt-4">
          <p className="text-[13px] font-medium text-muted-foreground">{other.label}</p>
          <p className="text-[24px] leading-tight font-semibold tracking-tight break-words">{other.name}</p>
          {driverView && trip.passenger.idNumber ? (
            <p className="mt-1 text-[14px] text-muted-foreground">
              {strings.pass.idNumber} <span className="font-mono font-medium text-foreground">{trip.passenger.idNumber}</span>
            </p>
          ) : null}
        </div>

        <Rule className="mt-5 mb-4" />

        <p className="text-[13px] font-medium text-muted-foreground tabular-nums">{formatDateLong(trip.startedAt)}</p>
        {/* The ::before is the track joining the two stops (dot edges at 30px from each end). */}
        <ol className="relative mt-1 before:absolute before:top-[30px] before:bottom-[30px] before:left-[9px] before:w-0.5 before:rounded-full before:bg-rule">
          <li className="flex h-12 items-center gap-3">
            <span aria-hidden className="relative grid size-5 shrink-0 place-items-center">
              <span className="size-3 rounded-full border-[2.5px] border-foreground bg-card" />
            </span>
            <span className="flex-1 text-[16px] text-muted-foreground">{t.start}</span>
            <time dateTime={trip.startedAt} className="font-mono text-[17px] font-semibold tabular-nums">
              {formatTime(trip.startedAt)}
            </time>
          </li>
          <li className="flex h-12 items-center gap-3">
            <span aria-hidden className="relative grid size-5 shrink-0 place-items-center">
              {active ? <LiveDot className="size-3" /> : <span className="size-3 rounded-full bg-foreground" />}
            </span>
            <span className="flex-1 text-[16px] text-muted-foreground">{t.end}</span>
            {trip.endedAt ? (
              <time dateTime={trip.endedAt} className="font-mono text-[17px] font-semibold tabular-nums">
                {formatTime(trip.endedAt)}
              </time>
            ) : (
              <span className="text-[15px] font-semibold text-success-strong">{t.inProgress}</span>
            )}
          </li>
        </ol>

        <Rule className="mt-4 mb-4" />

        <dl className="space-y-3">
          <Row label={own.label}>
            <span className="text-[16px] font-medium break-words">{own.name}</span>
          </Row>
          <Row label={t.vehicle}>
            {trip.vehicleNo ? (
              <PlateChip value={trip.vehicleNo} size="sm" />
            ) : (
              <span className="text-[16px] font-medium">{strings.pass.noId}</span>
            )}
          </Row>
        </dl>

        <Rule className="mt-4 mb-4" />

        <dl>
          <div className="flex items-baseline justify-between gap-4">
            <dt className="text-[16px] font-semibold">{t.duration}</dt>
            <dd className="text-right">
              {active ? (
                <LiveTimer startedAt={trip.startedAt} renderedAt={renderedAt} className="text-[22px] font-semibold" />
              ) : (
                <span className="font-mono text-[22px] font-semibold tabular-nums">
                  {trip.endedAt
                    ? formatDuration(Date.parse(trip.endedAt) - Date.parse(trip.startedAt))
                    : strings.pass.noId}
                </span>
              )}
            </dd>
          </div>
        </dl>
      </article>
    </ReceiptPaper>
  )
}

/** Trip #, the other person, the plate and "start – end · duration" on one line. */
function CompactReceipt({ trip, endedAt, className }: { trip: Trip; endedAt: string; className?: string }) {
  const driverView = trip.viewerRole === "driver"
  const other = driverView
    ? { label: t.passenger, name: trip.passenger.name }
    : { label: t.driver, name: trip.driver.name }
  return (
    <ReceiptPaper className={className}>
      <article aria-label={t.tripNo(trip.tripNo)}>
        <header className="flex min-h-8 flex-wrap items-center justify-between gap-x-3 gap-y-2">
          <p className="font-mono text-[13px] font-semibold tracking-[0.1em] text-muted-foreground uppercase">
            {t.tripNo(trip.tripNo)}
          </p>
          <VerifiedBadge />
        </header>
        <div className="mt-3 flex flex-wrap items-end justify-between gap-x-3 gap-y-2">
          <div className="min-w-0">
            <p className="text-[13px] font-medium text-muted-foreground">{other.label}</p>
            <p className="text-[20px] leading-tight font-semibold tracking-tight break-words">{other.name}</p>
          </div>
          {trip.vehicleNo ? <PlateChip value={trip.vehicleNo} size="sm" /> : null}
        </div>
        <Rule className="my-3.5" />
        <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1 tabular-nums">
          <p className="text-[15px] text-muted-foreground">
            {formatDate(trip.startedAt)} ·{" "}
            <span className="font-mono font-semibold text-foreground">{formatTimeRange(trip.startedAt, endedAt)}</span>
          </p>
          <p className="font-mono text-[17px] font-semibold">
            {formatDuration(Date.parse(endedAt) - Date.parse(trip.startedAt))}
          </p>
        </div>
      </article>
    </ReceiptPaper>
  )
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    // Wraps instead of truncating: full names and plates are the point of a receipt.
    <div className="flex min-h-7 flex-wrap items-center justify-between gap-x-4 gap-y-1">
      <dt className="text-[15px] text-muted-foreground">{label}</dt>
      <dd className="ml-auto min-w-0 max-w-full text-right">{children}</dd>
    </div>
  )
}

function VerifiedBadge() {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-success-soft px-3 py-1.5 text-[13px] font-semibold text-success-strong">
      <ShieldCheck className="size-4" aria-hidden />
      {t.verified}
    </span>
  )
}

/** Receipt-shaped placeholder while a trip loads. */
export function ReceiptSkeleton({ className }: { className?: string }) {
  const bar = "rounded-md bg-accent"
  return (
    <ReceiptPaper className={className}>
      <div aria-hidden className="animate-pulse">
        <div className="flex min-h-8 items-center justify-between gap-3">
          <div className={cn(bar, "h-4 w-20")} />
          <div className={cn(bar, "h-8 w-36 rounded-full")} />
        </div>
        <div className={cn(bar, "mt-5 h-3.5 w-14")} />
        <div className={cn(bar, "mt-2 h-7 w-48")} />
        <Rule className="mt-5 mb-4" />
        <div className={cn(bar, "h-3.5 w-24")} />
        <div className="mt-1">
          {[0, 1].map((i) => (
            <div key={i} className="flex h-12 items-center gap-3">
              <div className="size-5 rounded-full bg-accent" />
              <div className={cn(bar, "h-4 w-12")} />
              <div className={cn(bar, "ml-auto h-5 w-20")} />
            </div>
          ))}
        </div>
        <Rule className="mt-4 mb-4" />
        <div className="space-y-3">
          {[0, 1].map((i) => (
            <div key={i} className="flex min-h-7 items-center justify-between">
              <div className={cn(bar, "h-4 w-20")} />
              <div className={cn(bar, "h-5 w-32")} />
            </div>
          ))}
        </div>
        <Rule className="mt-4 mb-4" />
        <div className="flex items-center justify-between">
          <div className={cn(bar, "h-5 w-20")} />
          <div className={cn(bar, "h-7 w-24")} />
        </div>
      </div>
    </ReceiptPaper>
  )
}
