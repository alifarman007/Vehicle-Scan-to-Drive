"use client"

import { ArrowRight } from "lucide-react"
import { useRouter } from "next/navigation"
import { useEffect } from "react"

import { BottomBar } from "@/components/bottom-bar"
import { LiveDot } from "@/components/live"
import { NavButton } from "@/components/nav-button"
import { SuccessCheck } from "@/components/success-check"
import { firstName, formatTime } from "@/lib/format"
import { goBackTo } from "@/lib/nav-history"
import { strings } from "@/lib/strings"
import type { StartTripResult } from "@/lib/types"

const t = strings.start

/** How long the success moment stays before going back to the trips list. */
const AUTO_RETURN_MS = 2200

/** "Trip started" with the server's start time, then back to the trips list. */
export function StartSuccess({ result, passengerName }: { result: StartTripResult; passengerName: string }) {
  const router = useRouter()
  const { trip, alreadyStarted } = result

  useEffect(() => {
    const id = setTimeout(() => goBackTo(router, "/driver"), AUTO_RETURN_MS)
    return () => clearTimeout(id)
  }, [router])

  return (
    <main className="flex flex-1 flex-col">
      <div role="status" className="flex flex-1 flex-col items-center justify-center px-6 pt-safe text-center">
        <SuccessCheck />
        <h1 className="mt-5 animate-rise text-[28px] leading-tight font-semibold tracking-tight">{t.successTitle}</h1>
        <p className="mt-1.5 max-w-[32ch] animate-rise text-[16px] text-pretty text-muted-foreground">
          {alreadyStarted ? t.alreadyStarted : t.successBody(firstName(trip.passenger.name || passengerName))}
        </p>
        <p className="mt-5 inline-flex animate-rise items-center gap-2 rounded-full bg-success-soft px-3.5 py-1.5 text-[15px] font-semibold text-success-strong tabular-nums [animation-delay:120ms]">
          <LiveDot />
          {t.startedAt(formatTime(trip.startedAt))}
        </p>
      </div>
      <BottomBar>
        <NavButton href="/driver" back size="xl">
          <ArrowRight />
          {t.successCta}
        </NavButton>
      </BottomBar>
    </main>
  )
}
