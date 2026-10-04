"use client"

import { cn } from "cn"
import { useLayoutEffect, useRef, useState } from "react"

const ZOOM = 2.5

/**
 * A photo you can inspect: tap to zoom in 2.5× at the tapped spot, drag to
 * pan, tap again to fit. It zooms the image itself — never the page — so the
 * screen behind it is never left magnified (browser pinch-zoom would be).
 */
export function ZoomableImage({
  src,
  alt,
  className,
  imageClassName,
  onLoad,
  onError,
}: {
  src: string
  alt: string
  className?: string
  imageClassName?: string
  onLoad?: () => void
  onError?: () => void
}) {
  const scrollerRef = useRef<HTMLDivElement>(null)
  const imageRef = useRef<HTMLImageElement>(null)
  // Where the tap landed (0–1 across the fitted image) and the zoomed width.
  const [zoom, setZoom] = useState<{ fx: number; fy: number; width: number } | null>(null)

  // Bring the tapped spot to the middle of the screen once zoomed in.
  useLayoutEffect(() => {
    const scroller = scrollerRef.current
    const image = imageRef.current
    if (!zoom || !scroller || !image) return
    scroller.scrollLeft = image.offsetLeft + zoom.fx * image.clientWidth - scroller.clientWidth / 2
    scroller.scrollTop = image.offsetTop + zoom.fy * image.clientHeight - scroller.clientHeight / 2
  }, [zoom])

  return (
    <div
      ref={scrollerRef}
      className={cn("absolute inset-0 touch-pan-x touch-pan-y overflow-auto overscroll-contain [container-type:size]", className)}
    >
      {/* min-size grid keeps the image centred when it's smaller than the screen, and scrollable when bigger. */}
      <div className="grid min-h-full w-max min-w-full place-items-center">
        {/* eslint-disable-next-line @next/next/no-img-element -- signed or blob: URL, plain <img> on purpose */}
        <img
          ref={imageRef}
          src={src}
          alt={alt}
          draggable={false}
          decoding="async"
          onLoad={onLoad}
          onError={onError}
          onClick={(e) => {
            e.stopPropagation()
            if (zoom) {
              setZoom(null)
              return
            }
            const rect = e.currentTarget.getBoundingClientRect()
            setZoom({
              fx: (e.clientX - rect.left) / rect.width,
              fy: (e.clientY - rect.top) / rect.height,
              width: rect.width * ZOOM,
            })
          }}
          style={zoom ? { width: zoom.width, maxWidth: "none", maxHeight: "none" } : undefined}
          className={cn(
            "select-none",
            zoom ? "cursor-zoom-out" : "max-h-[100cqh] max-w-[100cqw] cursor-zoom-in",
            imageClassName
          )}
        />
      </div>
    </div>
  )
}
