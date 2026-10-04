import { getHomeState } from "@/lib/data"
import { handle } from "@/lib/http"
import { requireProfile } from "@/lib/session"

export const dynamic = "force-dynamic"

/** Polled by the home screens: profile, active trips and recent trips. */
export async function GET(req: Request) {
  return handle(req, async () => getHomeState(await requireProfile()))
}
