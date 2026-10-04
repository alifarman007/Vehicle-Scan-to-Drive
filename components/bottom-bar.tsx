"use client"

import { cn } from "cn"
import { useEffect, useRef } from "react"

/**
 * Sticky bottom action area in thumb reach, padded for the iPhone home bar.
 * Sits at the end of the page's flex column: pinned when content is long,
 * resting at the bottom when it is short. Its faded top lets taps through to
 * the content underneath, and its height feeds the page's scroll padding so a
 * focused field (or the caret while typing) is never hidden behind it.
 */
export function BottomBar({ children, className }: { children: React.ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const bar = ref.current
    if (!bar) return
    const root = document.documentElement
    const update = () => root.style.setProperty("--bottom-bar-h", `${bar.offsetHeight}px`)
    update()
    const observer = new ResizeObserver(update)
    observer.observe(bar)
    return () => {
      observer.disconnect()
      root.style.removeProperty("--bottom-bar-h")
    }
  }, [])

  return (
    <div
      ref={ref}
      className={cn(
        "no-print pointer-events-none sticky bottom-0 z-20 mt-auto bg-[linear-gradient(to_top,var(--background)_72%,transparent)] px-4 pt-8 pb-safe",
        className
      )}
    >
      <div className="pointer-events-auto flex flex-col gap-2">{children}</div>
    </div>
  )
}
