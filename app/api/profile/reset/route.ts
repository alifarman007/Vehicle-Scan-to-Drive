import { handle } from "@/lib/http"
import { clearSession } from "@/lib/session"

export const dynamic = "force-dynamic"

/** "Reset this device": forget the profile on this phone (it can be restored by code). */
export async function POST(req: Request) {
  return handle(req, async () => {
    await clearSession()
    return { ok: true }
  })
}
