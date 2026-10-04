"use client"

import { useRouter } from "next/navigation"
import useSWR from "swr"

import { ApiError, apiFetch } from "@/lib/api-client"
import { POLL_MS } from "@/lib/config"
import type { HomeState } from "@/lib/types"

/**
 * Live home data. Starts from the server-rendered state (no loading flash),
 * then polls every 4 s while `shouldPoll` says we're waiting on the other
 * phone — only while the page is visible. Responses are never cached.
 */
export function useHome(initial: HomeState, shouldPoll: (state: HomeState) => boolean) {
  const router = useRouter()
  const swr = useSWR<HomeState>(["/api/home", initial.me.code], ([url]: [string, string]) => apiFetch<HomeState>(url), {
    fallbackData: initial,
    refreshInterval: (latest) => (latest && shouldPoll(latest) ? POLL_MS : 0),
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

  // Prefer whichever is newer: a fresh server render or the last poll.
  const data = swr.data && swr.data.serverNow >= initial.serverNow ? swr.data : initial
  return { data, mutate: swr.mutate }
}
