"use client"

import { CarFront, ChevronRight, Pencil, Printer, ScanQrCode } from "lucide-react"
import Link from "next/link"
import { useEffect, useRef, useState } from "react"
import { flushSync } from "react-dom"
import { toast } from "sonner"

import { AppHeader } from "@/components/app-header"
import { BottomBar } from "@/components/bottom-bar"
import { DriverQrCard } from "@/components/driver-qr-card"
import { VehicleSheet } from "@/components/driver/vehicle-sheet"
import { LiveDot, LiveTimer } from "@/components/live"
import { NavButton } from "@/components/nav-button"
import { PlateChip } from "@/components/plate-chip"
import { SectionTitle } from "@/components/top-bar"
import { TripList } from "@/components/trip-list"
import { useHome } from "@/hooks/use-home"
import { useWarmScanner } from "@/hooks/use-warm-scanner"
import { firstName, formatTime } from "@/lib/format"
import { strings } from "@/lib/strings"
import type { HomeState, Trip } from "@/lib/types"

const t = strings.driver

/** Driver home: own QR + live trips while driving, quiet empty state otherwise. */
export function DriverHome({ initial, qrValue }: { initial: HomeState; qrValue: string }) {
  // Poll only while waiting for passengers to end their trips.
  const { data, mutate } = useHome(initial, (state) => state.active.length > 0)
  const [vehicleOpen, setVehicleOpen] = useState(false)
  const vehicleInputRef = useRef<HTMLInputElement>(null)

  function openVehicle() {
    flushSync(() => setVehicleOpen(true))
    // Focus within this tap, so iPhone Safari brings up the keyboard.
    vehicleInputRef.current?.focus()
  }
  const recent = data.recent.filter((r) => r.status !== "active")
  const hasActive = data.active.length > 0

  useTripCompletedToasts(data.active)
  // Drivers scan to start every trip: have the decoder ready.
  useWarmScanner(true)

  return (
    <>
      <AppHeader me={data.me} qrValue={qrValue} />
      <main className="flex flex-1 flex-col">
        <section className="px-5 pt-1">
          <h1 className="text-[26px] leading-tight font-semibold tracking-tight">
            {t.greeting(firstName(data.me.name))}
          </h1>
          <button
            type="button"
            onClick={openVehicle}
            aria-label={strings.header.changeVehicle}
            className="-ml-1.5 mt-1 inline-flex min-h-12 max-w-full items-center gap-2 rounded-xl px-1.5 transition-colors active:bg-accent/70"
          >
            <PlateChip value={data.me.vehicleNo ?? t.noVehicle} />
            <Pencil className="size-4 shrink-0 text-subtle-foreground" aria-hidden />
          </button>
        </section>

        {hasActive ? (
          <>
            <section className="px-4 pt-3">
              <DriverQrCard me={data.me} qrValue={qrValue} />
            </section>
            <section className="px-4 pt-9">
              <SectionTitle>
                {t.activeTitle}
                <span className="rounded-full bg-success-soft px-2 py-0.5 text-[12px] tracking-normal text-success-strong">
                  {data.active.length}
                </span>
              </SectionTitle>
              <ul className="space-y-3">
                {data.active.map((trip) => (
                  <ActiveTripRow key={trip.id} trip={trip} renderedAt={data.serverNow} />
                ))}
              </ul>
            </section>
          </>
        ) : (
          <section className="space-y-3 px-4 pt-4">
            <div className="flex flex-col items-center rounded-3xl border bg-card px-6 py-8 text-center shadow-card">
              <span className="grid size-14 place-items-center rounded-2xl bg-muted text-foreground">
                <CarFront className="size-7" aria-hidden />
              </span>
              <p className="mt-4 text-[18px] font-semibold tracking-tight">{t.emptyTitle}</p>
              <p className="mt-1 max-w-[30ch] text-[15px] text-pretty text-muted-foreground">{t.emptyBody}</p>
            </div>
            <Link
              href="/driver/qr"
              draggable={false}
              onContextMenu={(e) => e.preventDefault()}
              className="flex min-h-[68px] touch-callout-none items-center gap-3 rounded-2xl border bg-card px-4 py-3 shadow-card transition-colors select-none active:bg-muted"
            >
              <span className="grid size-10 place-items-center rounded-xl bg-muted">
                <Printer className="size-5" aria-hidden />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-[16px] font-semibold">{t.myQrTitle}</span>
                <span className="block text-[14px] text-muted-foreground">{t.myQrBody}</span>
              </span>
              <ChevronRight className="size-5 text-subtle-foreground" aria-hidden />
            </Link>
          </section>
        )}

        <section className="px-4 pt-9 pb-4">
          <SectionTitle>{strings.recent.title}</SectionTitle>
          <TripList trips={recent} renderedAt={data.serverNow} />
        </section>

        <BottomBar>
          <NavButton href="/scan" size="xl">
            <ScanQrCode />
            {t.startCta}
          </NavButton>
        </BottomBar>
      </main>

      <VehicleSheet
        open={vehicleOpen}
        onOpenChange={setVehicleOpen}
        current={data.me.vehicleNo}
        inputRef={vehicleInputRef}
        onSaved={(me) => void mutate({ ...data, me }, { revalidate: false })}
      />
    </>
  )
}

/** "Trip with {name} completed" when a trip drops out of the active list. */
function useTripCompletedToasts(active: Trip[]) {
  const previous = useRef<Map<string, string> | null>(null)
  useEffect(() => {
    const current = new Map(active.map((trip) => [trip.id, trip.passenger.name]))
    if (previous.current) {
      for (const [id, name] of previous.current) {
        if (!current.has(id)) toast.success(t.tripCompletedToast(name))
      }
    }
    previous.current = current
  }, [active])
}

function ActiveTripRow({ trip, renderedAt }: { trip: Trip; renderedAt: number }) {
  return (
    <li className="animate-rise">
      <Link
        href={`/trips/${trip.id}`}
        draggable={false}
        onContextMenu={(e) => e.preventDefault()}
        className="flex touch-callout-none items-center gap-3 rounded-2xl border bg-card p-3 pr-4 shadow-card transition-colors select-none active:bg-muted"
      >
        {/* eslint-disable-next-line @next/next/no-img-element -- short-lived signed URL, plain <img> on purpose */}
        <img
          src={trip.photoUrl}
          alt=""
          draggable={false}
          loading="lazy"
          decoding="async"
          className="size-14 shrink-0 rounded-xl bg-muted object-cover"
        />
        <div className="min-w-0 flex-1">
          <p className="truncate text-[16px] font-semibold">{trip.passenger.name}</p>
          <p className="text-[14px] text-muted-foreground tabular-nums">{t.started(formatTime(trip.startedAt))}</p>
        </div>
        <div className="flex flex-col items-end gap-1">
          <LiveTimer startedAt={trip.startedAt} renderedAt={renderedAt} className="text-[17px] font-semibold" />
          <span className="inline-flex items-center gap-1.5 text-[12px] font-semibold text-success-strong">
            <LiveDot className="size-2" />
            {strings.recent.active}
          </span>
        </div>
      </Link>
    </li>
  )
}
