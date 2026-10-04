"use client"

import { cn } from "cn"
import { Expand, ImageOff, RotateCcw } from "lucide-react"
import { useCallback, useState } from "react"

import { PhotoViewer } from "@/components/trip/photo-viewer"
import { strings } from "@/lib/strings"

type Status = "loading" | "ready" | "error"

/**
 * The dashboard photo taken at the start of the trip: a 16:9 preview that
 * opens full screen. If it can't load (offline, link expired), a calm
 * placeholder offers to try again.
 */
export function TripPhoto({ src, className }: { src: string; className?: string }) {
  const [attempt, setAttempt] = useState(0)
  const [status, setStatus] = useState<Status>("loading")
  const [open, setOpen] = useState(false)
  // A new query string makes the browser ask our photo route again (fresh signed link).
  const url = attempt === 0 ? src : `${src}?attempt=${attempt}`

  // The <img> is server-rendered, so it may finish (or fail) before hydration
  // attaches onLoad/onError. Read its state once it's in the DOM.
  const syncStatus = useCallback((img: HTMLImageElement | null) => {
    if (img?.complete) setStatus(img.naturalWidth > 0 ? "ready" : "error")
  }, [])

  if (status === "error") {
    return (
      <button
        type="button"
        onClick={() => {
          setStatus("loading")
          setAttempt((n) => n + 1)
        }}
        className={cn(
          "flex aspect-video w-full flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-rule bg-card/70 px-6 text-center transition-colors outline-none select-none focus-visible:ring-4 focus-visible:ring-ring/30 active:bg-muted",
          className
        )}
      >
        <span className="grid size-12 place-items-center rounded-full bg-muted text-muted-foreground">
          <ImageOff className="size-6" aria-hidden />
        </span>
        <span className="text-[16px] font-semibold">{strings.receipt.photoMissing}</span>
        <span className="inline-flex min-h-6 items-center gap-1.5 text-[14px] font-medium text-muted-foreground">
          <RotateCcw className="size-4" aria-hidden />
          {strings.common.retry}
        </span>
      </button>
    )
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label={strings.receipt.photoOpen}
        className={cn(
          "relative block aspect-video w-full overflow-hidden rounded-2xl border bg-muted shadow-card outline-none transition-[scale] duration-150 focus-visible:ring-4 focus-visible:ring-ring/30 active:scale-[0.99]",
          className
        )}
      >
        {/* Placeholder underneath: the photo paints over it as soon as it arrives. */}
        {status === "loading" ? <span aria-hidden className="absolute inset-0 animate-pulse bg-accent" /> : null}
        {/* eslint-disable-next-line @next/next/no-img-element -- short-lived signed URL, plain <img> on purpose */}
        <img
          key={url}
          ref={syncStatus}
          src={url}
          alt={strings.receipt.photo}
          draggable={false}
          decoding="async"
          onLoad={() => setStatus("ready")}
          onError={() => setStatus("error")}
          className="absolute inset-0 size-full object-cover"
        />
        <span
          aria-hidden
          className="absolute right-2.5 bottom-2.5 grid size-10 place-items-center rounded-full bg-black/55 text-white backdrop-blur-sm"
        >
          <Expand className="size-[18px]" />
        </span>
      </button>
      <PhotoViewer open={open} onOpenChange={setOpen} src={url} alt={strings.receipt.photo} />
    </>
  )
}
