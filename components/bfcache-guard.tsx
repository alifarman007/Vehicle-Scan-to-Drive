"use client"

import { useEffect } from "react"

/**
 * Every screen shows live trip data tied to this device's identity. If the
 * browser restores a page from its back/forward cache (a frozen snapshot),
 * reload it so it reflects the current cookie and trip state.
 */
export function BfcacheGuard() {
  useEffect(() => {
    const onPageShow = (event: PageTransitionEvent) => {
      if (event.persisted) window.location.reload()
    }
    window.addEventListener("pageshow", onPageShow)
    return () => window.removeEventListener("pageshow", onPageShow)
  }, [])
  return null
}
