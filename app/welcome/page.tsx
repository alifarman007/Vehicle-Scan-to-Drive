import type { Metadata } from "next"
import { redirect } from "next/navigation"

import { WelcomeFlow } from "@/components/welcome/welcome-flow"
import { homeFor, safeNext } from "@/lib/routes"
import { getCurrentProfile } from "@/lib/session"
import { strings } from "@/lib/strings"

export const metadata: Metadata = { title: { absolute: strings.welcome.title } }

export default async function WelcomePage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  const { next } = await searchParams
  const nextPath = safeNext(next)
  const me = await getCurrentProfile()
  if (me) redirect(nextPath ?? homeFor(me.role))
  return <WelcomeFlow next={nextPath} />
}
