import { resolveCode, toMe } from "@/lib/data"
import { handle, readJson } from "@/lib/http"
import { setSession } from "@/lib/session"

export const dynamic = "force-dynamic"

/** "Already registered? Enter your code": restore a profile on a new phone. */
export async function POST(req: Request) {
  return handle(req, async () => {
    const body = await readJson(req)
    const profile = await resolveCode(body.code)
    await setSession(profile.id)
    return { me: toMe(profile) }
  })
}
