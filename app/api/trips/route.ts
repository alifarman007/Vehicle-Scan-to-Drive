import { startTrip, toTrip } from "@/lib/data"
import { AppError } from "@/lib/errors"
import { handle } from "@/lib/http"
import { requireProfile } from "@/lib/session"
import type { StartTripResult } from "@/lib/types"

export const dynamic = "force-dynamic"

/**
 * Start a trip. FormData: `passengerCode` and `photo` (the compressed JPEG of
 * the dashboard). The start time is the database's now().
 */
export async function POST(req: Request) {
  return handle(req, async (): Promise<StartTripResult> => {
    const driver = await requireProfile("driver")
    let form: FormData
    try {
      form = await req.formData()
    } catch {
      throw new AppError("invalid_input")
    }
    const { trip, alreadyStarted } = await startTrip(driver, {
      passengerCode: form.get("passengerCode"),
      photo: form.get("photo"),
    })
    return { trip: toTrip(trip, driver), alreadyStarted }
  })
}
