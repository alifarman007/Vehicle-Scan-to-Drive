import { cn } from "cn"
import { Lock, ScanQrCode, Star } from "lucide-react"
import type { Metadata } from "next"
import { notFound } from "next/navigation"

import { BottomBar } from "@/components/bottom-bar"
import { NavButton } from "@/components/nav-button"
import { ReviewSummary } from "@/components/review/review-summary"
import { SectionTitle, TopBar } from "@/components/top-bar"
import { TripPhoto } from "@/components/trip/trip-photo"
import { TripReceipt } from "@/components/trip/trip-receipt"
import { TripWatcher } from "@/components/trip/trip-watcher"
import { getTrip, toTrip } from "@/lib/data"
import { homeFor } from "@/lib/routes"
import { requirePageProfile } from "@/lib/session"
import { strings } from "@/lib/strings"
import { serverTime } from "@/lib/time"

export const metadata: Metadata = { title: strings.trip.title }

/** One trip, for its driver or passenger only (anyone else gets "Nothing here"). */
export default async function TripPage({ params }: { params: Promise<{ id: string }> }) {
  const me = await requirePageProfile()
  const { id } = await params
  const row = await getTrip(id, me)
  if (!row) notFound()

  const trip = toTrip(row, me)
  const active = trip.status === "active"
  const passenger = trip.viewerRole === "passenger"
  // One main action at most: end the running trip, or rate a finished one.
  const action = passenger && active ? "arrived" : trip.canReview ? "rate" : null

  return (
    <>
      <TopBar backHref={homeFor(me.role)} />
      <main className={cn("flex flex-1 flex-col", !action && "pb-[max(2rem,env(safe-area-inset-bottom))]")}>
        <div className="px-5">
          <h1 className="text-[28px] leading-tight font-semibold tracking-tight">{strings.trip.title}</h1>
        </div>

        <div className="px-4 pt-5">
          <TripReceipt trip={trip} renderedAt={serverTime()} />
        </div>

        {trip.review ? <ReviewSummary className="px-4 pt-9" review={trip.review} /> : null}

        <section className="px-4 pt-9">
          <SectionTitle>{strings.receipt.photo}</SectionTitle>
          <TripPhoto src={trip.photoUrl} />
        </section>

        {!passenger && !active ? (
          <p className="flex items-center justify-center gap-2 px-6 pt-6 text-center text-[14px] text-muted-foreground">
            <Lock className="size-4 shrink-0" aria-hidden />
            {strings.trip.privateReview}
          </p>
        ) : null}

        {action ? (
          <BottomBar>
            {action === "arrived" ? (
              <NavButton href="/scan" size="xl">
                <ScanQrCode />
                {strings.passenger.arrivedCta}
              </NavButton>
            ) : (
              <NavButton href={`/trips/${trip.id}/done`} size="xl">
                <Star className="fill-current" />
                {strings.review.rateLater}
              </NavButton>
            )}
          </BottomBar>
        ) : null}
      </main>

      {/* Running trip: pick up the end the moment the passenger scans out. */}
      {active ? <TripWatcher tripId={trip.id} /> : null}
    </>
  )
}
