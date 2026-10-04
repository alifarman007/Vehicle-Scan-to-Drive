import { Avatar } from "@/components/avatar"
import { LiveTimer, OnTripBadge } from "@/components/live"
import { PlateChip } from "@/components/plate-chip"
import { formatTime } from "@/lib/format"
import { strings } from "@/lib/strings"
import type { Trip } from "@/lib/types"

/** Avatar, name and plate of a trip's driver. Long names and plates wrap at 360px. */
function DriverRow({ trip, label }: { trip: Trip; label?: string }) {
  return (
    <div className="flex items-center gap-3">
      <Avatar name={trip.driver.name} tone="muted" />
      <div className="min-w-0 flex-1">
        {label ? <p className="text-[13px] font-medium text-muted-foreground">{label}</p> : null}
        <p className="text-[18px] leading-snug font-semibold break-words">{trip.driver.name}</p>
        {trip.vehicleNo ? <PlateChip className="mt-1.5" value={trip.vehicleNo} /> : null}
      </div>
    </div>
  )
}

/** The running trip a passenger is about to end: who, which car, and since when. */
export function ActiveTripCard({ trip, renderedAt }: { trip: Trip; renderedAt: number }) {
  return (
    <div className="w-full max-w-[380px] rounded-3xl border bg-card text-left shadow-card">
      <div className="flex items-center justify-between gap-3 px-4 pt-4">
        <OnTripBadge />
        <span className="font-mono text-[13px] font-medium text-subtle-foreground">
          {strings.recent.tripNo(trip.tripNo)}
        </span>
      </div>
      <div className="p-4">
        <DriverRow trip={trip} />
      </div>
      <dl className="grid grid-cols-2 gap-3 border-t border-dashed border-rule px-4 pt-3 pb-4">
        <div>
          <dt className="text-[13px] font-medium text-muted-foreground">{strings.passenger.started}</dt>
          <dd className="text-[20px] leading-tight font-semibold tabular-nums">{formatTime(trip.startedAt)}</dd>
        </div>
        <div className="text-right">
          <dt className="text-[13px] font-medium text-muted-foreground">{strings.passenger.elapsed}</dt>
          <dd>
            <LiveTimer
              startedAt={trip.startedAt}
              renderedAt={renderedAt}
              className="text-[20px] leading-tight font-semibold"
            />
          </dd>
        </div>
      </dl>
    </div>
  )
}

/** The driver of the passenger's running trip, so they know whose QR to scan. */
export function YourDriverCard({ trip }: { trip: Trip }) {
  return (
    <div className="w-full max-w-[380px] rounded-2xl border bg-card p-4 text-left shadow-card">
      <DriverRow trip={trip} label={strings.q.yourDriver} />
    </div>
  )
}
