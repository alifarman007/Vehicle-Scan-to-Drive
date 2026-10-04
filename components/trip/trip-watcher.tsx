"use client"

import { useRouter } from "next/navigation"
import { useEffect } from "react"
import { toast } from "sonner"
import useSWR from "swr"

import { ApiError, apiFetch } from "@/lib/api-client"
import { POLL_MS } from "@/lib/config"
import { strings } from "@/lib/strings"
import type { TripResult } from "@/lib/types"

/**
 * While a trip is running, poll it (every 4 s, only while the page is
 * visible) and re-render the page with the final receipt once it ends.
 */
export function TripWatcher({ tripId }: { tripId: string }) {
  const router = useRouter()
  const { data } = useSWR<TripResult>(`/api/trips/${tripId}`, (url: string) => apiFetch<TripResult>(url), {
    refreshInterval: (latest) => (latest?.trip.status === "completed" ? 0 : POLL_MS),
    refreshWhenHidden: false,
    refreshWhenOffline: false,
    revalidateOnFocus: true,
    revalidateOnReconnect: true,
    dedupingInterval: 2000,
    onError: (err) => {
      // This device was reset or its profile removed: start over.
      if (err instanceof ApiError && err.status === 401) router.replace("/welcome")
    },
  })

  const trip = data?.trip
  const endedMessage =
    trip?.status === "completed"
      ? trip.viewerRole === "driver"
        ? strings.driver.tripCompletedToast(trip.passenger.name)
        : strings.end.endedToast
      : null

  useEffect(() => {
    if (!endedMessage) return
    toast.success(endedMessage)
    router.refresh()
  }, [endedMessage, router])

  return null
}
