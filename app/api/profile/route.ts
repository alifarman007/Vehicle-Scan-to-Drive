import { createProfile, toMe } from "@/lib/data"
import { AppError } from "@/lib/errors"
import { handle, readJson } from "@/lib/http"
import { getCurrentProfile, setSession } from "@/lib/session"

export const dynamic = "force-dynamic"

/** Onboarding: create a profile and remember this device with a cookie. */
export async function POST(req: Request) {
  return handle(req, async () => {
    // One pass per phone: a stale onboarding screen must not create a second
    // profile and orphan the first code (which may already be printed).
    if (await getCurrentProfile()) throw new AppError("already_registered", 409)
    const body = await readJson(req)
    const profile = await createProfile({
      role: body.role,
      name: body.name,
      phone: body.phone,
      idNumber: body.idNumber,
      vehicleNo: body.vehicleNo,
    })
    await setSession(profile.id)
    return { me: toMe(profile) }
  })
}
