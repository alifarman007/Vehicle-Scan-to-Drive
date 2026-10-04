"use client"

import { Dialog } from "@base-ui/react/dialog"
import { cn } from "cn"
import { ImageOff, LoaderCircle, X } from "lucide-react"
import { useState } from "react"

import { ZoomableImage } from "@/components/zoomable-image"
import { useCloseWatcher } from "@/hooks/use-close-watcher"
import { useThemeColor } from "@/hooks/use-theme-color"
import { strings } from "@/lib/strings"

/**
 * The dashboard photo full screen on black. Tap the photo to zoom in on the
 * odometer (the image zooms, never the page); tap outside it, the X, Escape
 * or Android Back closes it.
 */
export function PhotoViewer({
  open,
  onOpenChange,
  src,
  alt,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  src: string
  alt: string
}) {
  useCloseWatcher(open, () => onOpenChange(false))
  useThemeColor(open, "#000000")
  return (
    <Dialog.Root open={open} onOpenChange={(next) => onOpenChange(next)}>
      <Dialog.Portal>
        <Dialog.Popup
          onClick={() => onOpenChange(false)}
          className="fixed inset-0 z-[70] flex touch-pan-x touch-pan-y flex-col bg-black text-white outline-none transition-opacity duration-200 select-none data-ending-style:opacity-0 data-starting-style:opacity-0"
        >
          <Dialog.Title className="sr-only">{alt}</Dialog.Title>
          {/* Mounts with the popup, so every open starts from a fresh load state. */}
          <ViewerImage src={src} alt={alt} />
          <Dialog.Close
            aria-label={strings.trip.photoClose}
            className="absolute top-[calc(env(safe-area-inset-top)+8px)] right-3 grid size-12 place-items-center rounded-full bg-white/15 text-white backdrop-blur-md transition-colors outline-none focus-visible:ring-4 focus-visible:ring-white/40 active:bg-white/30"
          >
            <X className="size-6" aria-hidden />
          </Dialog.Close>
          <p className="pointer-events-none absolute inset-x-0 bottom-[max(1.5rem,env(safe-area-inset-bottom))] px-6 text-center text-[15px] text-white/65">
            {strings.trip.photoHint}
          </p>
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  )
}

function ViewerImage({ src, alt }: { src: string; alt: string }) {
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading")

  if (status === "error") {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-3 px-6 text-center text-white/70">
        <ImageOff className="size-9" aria-hidden />
        <p className="text-[16px] font-medium">{strings.receipt.photoMissing}</p>
      </div>
    )
  }

  return (
    <div className="relative flex min-h-0 flex-1 items-center justify-center">
      {status === "loading" ? (
        <LoaderCircle className="absolute size-7 animate-spin text-white/60" aria-hidden />
      ) : null}
      <ZoomableImage
        src={src}
        alt={alt}
        onLoad={() => setStatus("ready")}
        onError={() => setStatus("error")}
        imageClassName={cn("transition-opacity duration-200", status === "ready" ? "opacity-100" : "opacity-0")}
      />
    </div>
  )
}
