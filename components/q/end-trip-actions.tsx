"use client"

import { Flag } from "lucide-react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

import { NavButton } from "@/components/nav-button"
import { Button } from "@/components/ui/button"
import { useAction } from "@/hooks/use-action"
import { errorCode, errorMessage, postJson } from "@/lib/api-client"
import type { ErrorCode } from "@/lib/errors"
import { replaceNavigation } from "@/lib/nav-history"
import { strings } from "@/lib/strings"
import type { TripResult } from "@/lib/types"

/** Errors that mean this screen is out of date (e.g. the trip already ended elsewhere). */
const STALE: ReadonlySet<ErrorCode> = new Set<ErrorCode>([
  "no_active_trip",
  "wrong_driver",
  "code_not_found",
  "not_registered",
  "wrong_role",
])

/**
 * The passenger confirms the end of their trip. Nothing changes until this tap:
 * opening the QR link itself never ends a trip.
 */
export function EndTripActions({ driverCode }: { driverCode: string }) {
  const router = useRouter()

  const [pending, endTrip] = useAction(async () => {
    toast.dismiss("end-trip")
    try {
      const { trip } = await postJson<TripResult>("/api/trips/end", { driverCode })
      // Replace: Back must not return to the confirmation of a finished trip.
      replaceNavigation(`/trips/${trip.id}/done`)
      router.replace(`/trips/${trip.id}/done`)
      return "stay-pending"
    } catch (err) {
      toast.error(errorMessage(err), { id: "end-trip" })
      // Re-render on the server so the screen shows what's true now.
      if (STALE.has(errorCode(err))) router.refresh()
    }
  })

  return (
    <>
      <Button size="xl" loading={pending} onClick={() => void endTrip()}>
        <Flag />
        {strings.end.confirmCta}
      </Button>
      <NavButton href="/passenger" back variant="ghost" size="xl" disabled={pending}>
        {strings.common.cancel}
      </NavButton>
    </>
  )
}
