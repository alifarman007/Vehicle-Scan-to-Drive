"use client"

import { useEffect } from "react"

import { warmQrDetector } from "@/lib/qr-decoder"

/**
 * Loads the QR decoder while the phone is idle on a home screen, so the
 * scanner is instant (on iPhone this downloads the ~1 MB ZXing .wasm once).
 */
export function useWarmScanner(enabled: boolean) {
  useEffect(() => {
    if (!enabled) return
    const w = window as Window & {
      requestIdleCallback?: (cb: () => void, opts?: { timeout: number }) => number
      cancelIdleCallback?: (id: number) => void
    }
    if (w.requestIdleCallback) {
      const id = w.requestIdleCallback(warmQrDetector, { timeout: 4000 })
      return () => w.cancelIdleCallback?.(id)
    }
    const id = setTimeout(warmQrDetector, 1500)
    return () => clearTimeout(id)
  }, [enabled])
}
