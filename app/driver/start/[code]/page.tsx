import type { Metadata } from "next"
import { redirect } from "next/navigation"

import { StartBlocked } from "@/components/start/start-blocked"
import { StartTrip } from "@/components/start/start-trip"
import { checkPassengerForStart } from "@/lib/data"
import { AppError } from "@/lib/errors"
import { requirePageProfile } from "@/lib/session"
import { strings } from "@/lib/strings"
import { serverTime } from "@/lib/time"

export const metadata: Metadata = { title: strings.start.title }

/**
 * A driver scanned a passenger's Ride Pass. The code is checked here on the
 * server (nothing is written on page load); a code that can't start a trip
 * gets a friendly screen instead of the start flow.
 */
export default async function StartTripPage({ params }: { params: Promise<{ code: string }> }) {
  const driver = await requirePageProfile("driver")
  const { code } = await params

  let check: Awaited<ReturnType<typeof checkPassengerForStart>>
  try {
    check = await checkPassengerForStart(driver, code)
  } catch (err) {
    // Wrong QR, unknown code, busy passenger… Real failures (5xx) go to the
    // error screen, whose Try again re-runs this check.
    if (err instanceof AppError && err.status < 500) return <StartBlocked code={err.code} />
    throw err
  }

  // Already started with this passenger (e.g. Back after starting): show the trips.
  if (check.existingTrip) redirect("/driver")

  const { passenger } = check
  return (
    <StartTrip
      passenger={{ name: passenger.name, idNumber: passenger.idNumber, phone: passenger.phone }}
      passengerCode={passenger.code}
      renderedAt={serverTime()}
    />
  )
}
