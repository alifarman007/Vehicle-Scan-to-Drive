import { useSyncExternalStore } from "react"

/*
 * A shared one-second ticker aligned to the server clock, so live timers and
 * the start clock agree with the database even if the phone's clock is off.
 *
 * The offset comes from the server time stamped into the first HTML load
 * (`window.__rpClock`, see app/layout.tsx) and is refreshed by every API
 * response (`X-Server-Now`, see lib/http.ts). The first client render uses
 * the page's own server time, so hydration always matches.
 */

declare global {
  interface Window {
    __rpClock?: { s: number; c: number }
  }
}

let offsetMs: number | null = null

function offset(): number {
  if (offsetMs === null) {
    const boot = typeof window === "undefined" ? undefined : window.__rpClock
    offsetMs = boot ? boot.s - boot.c : 0
  }
  return offsetMs
}

export function syncServerClock(serverNow: number, receivedAt: number) {
  if (Number.isFinite(serverNow)) offsetMs = serverNow - receivedAt
}

export function serverNowMs(): number {
  return Date.now() + offset()
}

const listeners = new Set<() => void>()
let timer: ReturnType<typeof setInterval> | null = null

function subscribe(listener: () => void) {
  listeners.add(listener)
  if (!timer) {
    timer = setInterval(() => listeners.forEach((l) => l()), 1000)
  }
  return () => {
    listeners.delete(listener)
    if (listeners.size === 0 && timer) {
      clearInterval(timer)
      timer = null
    }
  }
}

const getSnapshot = () => Math.floor(serverNowMs() / 1000)

/** Current server time in ms, ticking once a second. Pass the page's server time for SSR. */
export function useNow(renderedAt: number): number {
  const seconds = useSyncExternalStore(subscribe, getSnapshot, () => Math.floor(renderedAt / 1000))
  return seconds * 1000
}
