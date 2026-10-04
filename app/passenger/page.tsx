import type { Metadata } from "next"

import { PassengerHome } from "@/components/passenger/passenger-home"
import { qrUrl } from "@/lib/codes"
import { getHomeState } from "@/lib/data"
import { getAppOrigin } from "@/lib/origin"
import { requirePageProfile } from "@/lib/session"
import { strings } from "@/lib/strings"

export const metadata: Metadata = { title: strings.pass.rideLabel }

export default async function PassengerPage() {
  const me = await requirePageProfile("passenger")
  const [state, origin] = await Promise.all([getHomeState(me), getAppOrigin()])
  return <PassengerHome initial={state} qrValue={qrUrl(origin, me.code)} />
}
