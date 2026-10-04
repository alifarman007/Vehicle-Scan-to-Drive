import {
  ArrowRight,
  CarFront,
  FlagOff,
  House,
  Printer,
  QrCode,
  ScanQrCode,
  SearchX,
  Ticket,
  TicketCheck,
  UserX,
} from "lucide-react"

import { NavButton } from "@/components/nav-button"
import { EndTripActions } from "@/components/q/end-trip-actions"
import { ResultScreen } from "@/components/q/result-screen"
import { ActiveTripCard, YourDriverCard } from "@/components/q/trip-cards"
import { formatCode } from "@/lib/codes"
import { firstName } from "@/lib/format"
import { homeFor } from "@/lib/routes"
import { strings } from "@/lib/strings"
import type { Role, Trip } from "@/lib/types"

/*
 * What a QR link shows when it doesn't lead straight into a flow. Leaving one
 * of these screens replaces it in history, so Back never lands on a dead end;
 * opening the scanner pushes, so Back returns here.
 */

const t = strings.q

function GoHome({ role, secondary = false }: { role: Role; secondary?: boolean }) {
  return (
    <NavButton href={homeFor(role)} replace size="xl" variant={secondary ? "ghost" : "default"}>
      <House />
      {strings.common.goHome}
    </NavButton>
  )
}

function OpenPass() {
  return (
    <NavButton href="/passenger" replace size="xl">
      <Ticket />
      {t.goToPass}
    </NavButton>
  )
}

function OpenScanner({ label }: { label: string }) {
  return (
    <NavButton href="/scan" size="xl">
      <ScanQrCode />
      {label}
    </NavButton>
  )
}

/**
 * Not a code, or nobody has it. `code` is shown when it was well-formed, to
 * compare with the printed one; `role` is null when this phone isn't set up.
 */
export function UnknownCodeScreen({ code, role }: { code: string | null; role: Role | null }) {
  return (
    <ResultScreen
      icon={SearchX}
      tone="warning"
      title={t.unknownTitle}
      body={t.unknownBody}
      actions={
        role === "driver" ? (
          <>
            <OpenScanner label={strings.scanner.scanAgain} />
            <GoHome role={role} secondary />
          </>
        ) : role ? (
          <GoHome role={role} />
        ) : (
          <NavButton href="/" replace size="xl">
            <ArrowRight />
            {t.openApp}
          </NavButton>
        )
      }
    >
      {code ? (
        <p className="rounded-xl border bg-card py-2 pr-4 pl-[calc(1rem+0.2em)] font-mono text-[20px] font-semibold tracking-[0.2em] shadow-card">
          {formatCode(code)}
        </p>
      ) : null}
    </ResultScreen>
  )
}

/** A driver opened their own QR (e.g. checking a print). */
export function OwnDriverQrScreen() {
  return (
    <ResultScreen
      icon={QrCode}
      tone="success"
      title={t.ownDriverTitle}
      body={t.ownDriverBody}
      actions={
        <>
          <NavButton href="/driver/qr" replace size="xl">
            <Printer />
            {strings.profile.myQr}
          </NavButton>
          <GoHome role="driver" secondary />
        </>
      }
    />
  )
}

/** A driver opened another driver's QR instead of a passenger's Ride Pass. */
export function DriverViewsDriverScreen() {
  return (
    <ResultScreen
      icon={CarFront}
      tone="warning"
      title={t.driverViewsDriverTitle}
      body={t.driverViewsDriverBody}
      actions={
        <>
          <OpenScanner label={strings.driver.startCta} />
          <GoHome role="driver" secondary />
        </>
      }
    />
  )
}

export function OwnPassScreen() {
  return (
    <ResultScreen
      icon={TicketCheck}
      tone="success"
      title={t.ownPassTitle}
      body={t.ownPassBody}
      actions={<OpenPass />}
    />
  )
}

/** A passenger opened someone else's Ride Pass. */
export function PassengerViewsPassengerScreen() {
  return (
    <ResultScreen
      icon={Ticket}
      tone="warning"
      title={t.passengerViewsPassengerTitle}
      body={t.passengerViewsPassengerBody}
      actions={<GoHome role="passenger" />}
    />
  )
}

/** A passenger opened a driver's QR without a running trip. */
export function NoTripScreen() {
  return (
    <ResultScreen icon={FlagOff} title={t.noTripTitle} body={t.noTripBody} actions={<OpenPass />} />
  )
}

/** A passenger opened a driver's QR from another car. Shows whose QR they need. */
export function WrongDriverScreen({ trip }: { trip: Trip }) {
  return (
    <ResultScreen
      icon={UserX}
      tone="destructive"
      title={t.wrongDriverTitle}
      body={t.wrongDriverBody}
      actions={
        <>
          <OpenScanner label={strings.scanner.scanAgain} />
          <GoHome role="passenger" secondary />
        </>
      }
    >
      <YourDriverCard trip={trip} />
    </ResultScreen>
  )
}

/** The passenger opened their own driver's QR: confirm, then end the trip. */
export function EndTripScreen({
  trip,
  driverCode,
  renderedAt,
}: {
  trip: Trip
  driverCode: string
  renderedAt: number
}) {
  return (
    <ResultScreen
      title={strings.end.confirmTitle}
      body={strings.end.confirmBody(firstName(trip.driver.name))}
      actions={<EndTripActions driverCode={driverCode} />}
    >
      <ActiveTripCard trip={trip} renderedAt={renderedAt} />
    </ResultScreen>
  )
}
