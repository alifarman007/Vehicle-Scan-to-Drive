import { redirect } from "next/navigation"

import { homeFor } from "@/lib/routes"
import { getCurrentProfile } from "@/lib/session"

/** Server-side redirect by device cookie, so there's no flash of the wrong screen. */
export default async function Home() {
  const me = await getCurrentProfile()
  redirect(me ? homeFor(me.role) : "/welcome")
}
