"use client"

import { ScanQrCode } from "lucide-react"
import { useEffect, useRef } from "react"
import { toast } from "sonner"

import { AppHeader } from "@/components/app-header"
import { BottomBar } from "@/components/bottom-bar"
import { LiveTimer, OnTripBadge } from "@/components/live"
import { NavButton } from "@/components/nav-button"
import { PlateChip } from "@/components/plate-chip"
import { RidePass } from "@/components/ride-pass"
import { SectionTitle } from "@/components/top-bar"
import { TripList } from "@/components/trip-list"
import { useHome } from "@/hooks/use-home"
import { firstName, formatTime } from "@/lib/format"
import { strings } from "@/lib/strings"
import type { HomeState, Me, Trip } from "@/lib/types"

const t = strings.passenger

/** Passenger home: the Ride Pass while waiting, live trip card while riding. */
export function PassengerHome({ initial, qrValue }: { initial: HomeState; qrValue: string }) {
  // Poll only while waiting for a driver to start the trip.
  const { data } = useHome(initial, (state) => state.active.length === 0)
  const trip = data.active[0] ?? null
  const recent = data.recent.filter((r) => r.status !== "active")

  useTripStartedToast(trip)

  return (
    <>
      <AppHeader me={data.me} qrValue={qrValue} />
      <main className="flex flex-1 flex-col">
        {trip ? (
          <ActiveTrip trip={trip} renderedAt={data.serverNow} />
        ) : (
          <Waiting me={data.me} qrValue={qrValue} />
        )}

        <section className="px-4 pt-9 pb-4">
          <SectionTitle>{strings.recent.title}</SectionTitle>
          <TripList trips={recent} renderedAt={data.serverNow} />
        </section>

        {trip ? (
          <BottomBar>
            <NavButton href="/scan" size="xl">
              <ScanQrCode />
              {t.arrivedCta}
            </NavButton>
          </BottomBar>
        ) : null}
      </main>
    </>
  )
}

/** Toast once when the trip appears (not when the page opens mid-trip). */
function useTripStartedToast(trip: Trip | null) {
  const previous = useRef<string | null | undefined>(undefined)
  const id = trip?.id ?? null
  useEffect(() => {
    if (previous.current === null && id) {
      toast.success(t.tripStartedToast)
      if ("vibrate" in navigator) navigator.vibrate?.(50)
    }
    previous.current = id
  }, [id])
}

function Waiting({ me, qrValue }: { me: Me; qrValue: string }) {
  return (
    <section className="px-4 pt-1">
      <h1 className="px-1 text-[26px] leading-tight font-semibold tracking-tight">{t.greeting(firstName(me.name))}</h1>
      <p className="px-1 text-[16px] text-muted-foreground">{t.passSubtitle}</p>
      <RidePass className="mt-5" me={me} qrValue={qrValue} />
      <p className="mt-5 flex items-center justify-center gap-2.5 text-[14px] font-medium text-muted-foreground">
        <span aria-hidden className="relative inline-flex size-2">
          <span className="absolute inset-0 animate-live rounded-full bg-subtle-foreground/60" />
          <span className="relative inline-flex size-2 rounded-full bg-subtle-foreground" />
        </span>
        {t.waiting}
      </p>
    </section>
  )
}

function ActiveTrip({ trip, renderedAt }: { trip: Trip; renderedAt: number }) {
  return (
    <section className="animate-rise px-4 pt-1">
      <h1 className="px-1 text-[26px] leading-tight font-semibold tracking-tight">{t.onTripTitle}</h1>

      <div className="mt-4 overflow-hidden rounded-3xl border bg-card shadow-float">
        <div className="flex items-center justify-between px-5 pt-5">
          <OnTripBadge />
          <span className="font-mono text-[13px] font-medium text-subtle-foreground">
            {strings.recent.tripNo(trip.tripNo)}
          </span>
        </div>

        <div className="px-5 pt-4">
          <p className="text-[13px] font-medium text-muted-foreground">{t.driver}</p>
          <p className="text-[24px] leading-tight font-semibold tracking-tight break-words">{trip.driver.name}</p>
          {trip.vehicleNo ? <PlateChip className="mt-2.5" value={trip.vehicleNo} /> : null}
        </div>

        <div className="mt-5 border-t border-dashed border-rule px-5 pt-5 pb-6 text-center">
          <p className="text-[13px] font-medium text-muted-foreground">{t.elapsed}</p>
          <LiveTimer
            startedAt={trip.startedAt}
            renderedAt={renderedAt}
            className="mt-1 block text-[46px] leading-none font-semibold tracking-tight"
          />
          <p className="mt-3 text-[15px] text-muted-foreground tabular-nums">
            {t.started} {formatTime(trip.startedAt)}
          </p>
        </div>
      </div>

      <p className="mx-auto mt-4 max-w-[34ch] px-1 text-center text-[14px] text-pretty text-muted-foreground">
        {t.arrivedHint}
      </p>
    </section>
  )
}
