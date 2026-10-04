import type { Metadata } from "next"

import { DriverHome } from "@/components/driver/driver-home"
import { qrUrl } from "@/lib/codes"
import { getHomeState } from "@/lib/data"
import { getAppOrigin } from "@/lib/origin"
import { requirePageProfile } from "@/lib/session"
import { strings } from "@/lib/strings"

export const metadata: Metadata = { title: strings.roles.driver }

export default async function DriverPage() {
  const me = await requirePageProfile("driver")
  const [state, origin] = await Promise.all([getHomeState(me), getAppOrigin()])
  return <DriverHome initial={state} qrValue={qrUrl(origin, me.code)} />
}
