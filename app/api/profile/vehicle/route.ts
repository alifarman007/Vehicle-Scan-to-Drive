import { toMe, updateVehicle } from "@/lib/data"
import { handle, readJson } from "@/lib/http"
import { requireProfile } from "@/lib/session"

export const dynamic = "force-dynamic"

/** Drivers switch cars: change the vehicle number used for new trips. */
export async function POST(req: Request) {
  return handle(req, async () => {
    const driver = await requireProfile("driver")
    const body = await readJson(req)
    const updated = await updateVehicle(driver, body.vehicleNo)
    return { me: toMe(updated) }
  })
}
