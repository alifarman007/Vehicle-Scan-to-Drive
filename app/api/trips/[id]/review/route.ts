import { submitReview, toTrip } from "@/lib/data"
import { handle, readJson } from "@/lib/http"
import { requireProfile } from "@/lib/session"
import type { TripResult } from "@/lib/types"

export const dynamic = "force-dynamic"

/** The passenger rates a completed trip, once. Body: { rating, tags, comment }. */
export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  return handle(req, async (): Promise<TripResult> => {
    const passenger = await requireProfile("passenger")
    const { id } = await ctx.params
    const body = await readJson(req)
    const trip = await submitReview(passenger, id, {
      rating: body.rating,
      tags: body.tags,
      comment: body.comment,
    })
    return { trip: toTrip(trip, passenger) }
  })
}
