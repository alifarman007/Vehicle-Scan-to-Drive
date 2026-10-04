import type { Metadata } from "next"
import { notFound, redirect } from "next/navigation"

import { TripDone } from "@/components/trip/trip-done"
import { getTrip, toTrip } from "@/lib/data"
import { requirePageProfile } from "@/lib/session"
import { strings } from "@/lib/strings"
import { serverTime } from "@/lib/time"

export const metadata: Metadata = { title: strings.receipt.title }

/** The passenger's receipt and review, right after ending a trip (or later, to rate it). */
export default async function TripDonePage({ params }: { params: Promise<{ id: string }> }) {
  const me = await requirePageProfile("passenger")
  const { id } = await params
  const row = await getTrip(id, me)
  if (!row) notFound()
  // Still running: nothing to sum up yet.
  if (row.status === "active") redirect("/passenger")
  return <TripDone trip={toTrip(row, me)} renderedAt={serverTime()} />
}
