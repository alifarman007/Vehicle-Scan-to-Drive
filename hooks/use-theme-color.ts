"use client"

import { useEffect } from "react"

/**
 * While `active`, tints the browser's status bar and toolbar (Android Chrome)
 * to `color` — e.g. near-black behind a full-screen camera or photo, so a light
 * bar doesn't glare in a dark car. Restores the previous colour afterwards.
 */
export function useThemeColor(active: boolean, color: string) {
  useEffect(() => {
    if (!active) return
    const meta = document.querySelector<HTMLMetaElement>('meta[name="theme-color"]')
    if (!meta) return
    const previous = meta.content
    meta.content = color
    return () => {
      meta.content = previous
    }
  }, [active, color])
}
