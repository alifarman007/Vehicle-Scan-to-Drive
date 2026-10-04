import { getTrip, toTrip } from "@/lib/data"
import { AppError } from "@/lib/errors"
import { handle } from "@/lib/http"
import { requireProfile } from "@/lib/session"
import type { TripResult } from "@/lib/types"

export const dynamic = "force-dynamic"

/** One trip, for its driver or passenger only (reviews only for the passenger). */
export async function GET(req: Request, ctx: { params: Promise<{ id: string }> }) {
  return handle(req, async (): Promise<TripResult> => {
    const viewer = await requireProfile()
    const { id } = await ctx.params
    const trip = await getTrip(id, viewer)
    if (!trip) throw new AppError("trip_not_found", 404)
    return { trip: toTrip(trip, viewer) }
  })
}
