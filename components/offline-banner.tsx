"use client"

import { WifiOff } from "lucide-react"
import { useSyncExternalStore } from "react"

import { strings } from "@/lib/strings"

function subscribe(onChange: () => void) {
  window.addEventListener("online", onChange)
  window.addEventListener("offline", onChange)
  return () => {
    window.removeEventListener("online", onChange)
    window.removeEventListener("offline", onChange)
  }
}

export function useOnline(): boolean {
  return useSyncExternalStore(
    subscribe,
    () => navigator.onLine,
    () => true
  )
}

/** Small pill under the status bar while the phone has no connection. */
export function OfflineBanner() {
  const online = useOnline()
  if (online) return null
  return (
    <div
      role="status"
      aria-live="polite"
      className="no-print pointer-events-none fixed inset-x-0 top-0 z-[100] flex justify-center pt-[calc(env(safe-area-inset-top)+8px)]"
    >
      <div className="flex animate-rise items-center gap-2 rounded-full bg-warning px-3.5 py-2 text-[14px] font-semibold text-warning-foreground shadow-float">
        <WifiOff className="size-4" aria-hidden />
        {strings.offline}
      </div>
    </div>
  )
}
