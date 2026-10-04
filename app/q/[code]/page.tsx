import type { Metadata } from "next"
import { redirect } from "next/navigation"

import {
  DriverViewsDriverScreen,
  EndTripScreen,
  NoTripScreen,
  OwnDriverQrScreen,
  OwnPassScreen,
  PassengerViewsPassengerScreen,
  UnknownCodeScreen,
  WrongDriverScreen,
} from "@/components/q/qr-screens"
import { normalizeCode } from "@/lib/codes"
import { getActiveTrips, getProfileByCode, toTrip } from "@/lib/data"
import { getCurrentProfile } from "@/lib/session"
import { strings } from "@/lib/strings"
import { serverTime } from "@/lib/time"

export const metadata: Metadata = {
  title: { absolute: strings.q.title },
  // Personal codes: keep these links out of search results.
  robots: { index: false, follow: false },
}

/** Some messaging apps percent-encode links; normalizeCode rejects anything odd. */
function decodeParam(value: string): string {
  try {
    return decodeURIComponent(value)
  } catch {
    return value
  }
}

/*
 * Every QR holds a link to this page, so the phone's own camera app works as
 * well as the in-app scanner. It only reads, never writes: it sends the viewer
 * into the right flow or explains what they scanned. Ending a trip still takes
 * a tap. No loading.tsx on purpose: without a Suspense boundary, redirect()
 * answers with a real HTTP redirect instead of a skeleton and a client hop.
 */
export default async function QrPage({ params }: { params: Promise<{ code: string }> }) {
  const code = normalizeCode(decodeParam((await params).code))
  const [target, me] = await Promise.all([code ? getProfileByCode(code) : null, getCurrentProfile()])

  if (!code || !target) return <UnknownCodeScreen code={code} role={me?.role ?? null} />

  // New phone: onboard (or restore by code) first, then come back here.
  if (!me) redirect(`/welcome?next=/q/${code}`)

  if (me.role === "driver") {
    if (target.role === "passenger") redirect(`/driver/start/${code}`)
    return target.id === me.id ? <OwnDriverQrScreen /> : <DriverViewsDriverScreen />
  }

  if (target.role === "passenger") {
    return target.id === me.id ? <OwnPassScreen /> : <PassengerViewsPassengerScreen />
  }

  // A passenger opened a driver's QR: is it the driver of their running trip?
  const active = (await getActiveTrips(me))[0]
  if (!active) return <NoTripScreen />
  const trip = toTrip(active, me)
  if (active.driver_id !== target.id) return <WrongDriverScreen trip={trip} />
  return <EndTripScreen trip={trip} driverCode={code} renderedAt={serverTime()} />
}
