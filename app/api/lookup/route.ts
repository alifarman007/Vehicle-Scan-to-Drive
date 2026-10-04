import { checkPassengerForStart } from "@/lib/data"
import { handle } from "@/lib/http"
import { requireProfile } from "@/lib/session"
import type { PassengerCheck } from "@/lib/types"

export const dynamic = "force-dynamic"

/**
 * A driver scanned a code: is it a passenger who can start a trip? Wrong-type
 * QRs, unknown codes and busy passengers come back as friendly error codes.
 */
export async function GET(req: Request) {
  return handle(req, async (): Promise<PassengerCheck> => {
    const driver = await requireProfile("driver")
    const code = new URL(req.url).searchParams.get("code") ?? ""
    const { passenger, existingTrip } = await checkPassengerForStart(driver, code)
    return {
      code: passenger.code,
      passenger: { name: passenger.name, idNumber: passenger.idNumber, phone: passenger.phone },
      existingTripId: existingTrip?.id ?? null,
    }
  })
}
