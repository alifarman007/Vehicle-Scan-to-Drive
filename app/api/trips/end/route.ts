import { endTrip, toTrip } from "@/lib/data"
import { handle, readJson } from "@/lib/http"
import { requireProfile } from "@/lib/session"
import type { TripResult } from "@/lib/types"

export const dynamic = "force-dynamic"

/** The passenger scanned their driver's QR: end the active trip (database time). */
export async function POST(req: Request) {
  return handle(req, async (): Promise<TripResult> => {
    const passenger = await requireProfile("passenger")
    const body = await readJson(req)
    const trip = await endTrip(passenger, body.driverCode)
    return { trip: toTrip(trip, passenger) }
  })
}
