"use client"

import { useEffect } from "react"

/** Keeps the screen on while `active` (e.g. a QR is being shown). */
export function useWakeLock(active: boolean) {
  useEffect(() => {
    if (!active || !("wakeLock" in navigator)) return
    let sentinel: WakeLockSentinel | null = null
    let stopped = false

    const acquire = async () => {
      try {
        const lock = await navigator.wakeLock.request("screen")
        if (stopped) await lock.release()
        else sentinel = lock
      } catch {
        // Not allowed right now (battery saver, hidden page). Harmless.
      }
    }
    const onVisibility = () => {
      if (document.visibilityState === "visible") void acquire()
    }

    void acquire()
    document.addEventListener("visibilitychange", onVisibility)
    return () => {
      stopped = true
      document.removeEventListener("visibilitychange", onVisibility)
      void sentinel?.release().catch(() => {})
    }
  }, [active])
}
