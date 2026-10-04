"use client"

import { useEffect, useEffectEvent } from "react"

import { getQrDetector } from "@/lib/qr-decoder"

type QrDetector = Awaited<ReturnType<typeof getQrDetector>>

/** About eight reads a second: instant to the eye, light on battery. */
const READ_EVERY_MS = 120
/** After a failed read or decoder load, wait a little longer. */
const RETRY_MS = 600
/** Decode at most this many pixels across; plenty for a QR filling the window. */
const MAX_SIDE = 640
/** Also read a thin margin around the window, so a QR on its edge still scans. */
const MARGIN = 0.1
/** Every other read looks at the whole frame (scaled down to this), for QRs held too close or off-centre. */
const FULL_MAX_SIDE = 960

type Region = { x: number; y: number; side: number }

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max)
}

/**
 * The square of the camera frame (in video pixels) behind the on-screen
 * window. The video is `object-cover`: scaled up to fill its box and centred,
 * so part of the frame is cut off on one axis.
 */
function windowRegion(video: HTMLVideoElement, frame: HTMLElement): Region | null {
  const width = video.videoWidth
  const height = video.videoHeight
  if (!width || !height || video.readyState < HTMLMediaElement.HAVE_CURRENT_DATA) return null
  const box = video.getBoundingClientRect()
  const win = frame.getBoundingClientRect()
  if (!box.width || !box.height || !win.width || !win.height) return null

  const scale = Math.max(box.width / width, box.height / height)
  const left = box.left + (box.width - width * scale) / 2
  const top = box.top + (box.height - height * scale) / 2
  const side = Math.min((Math.max(win.width, win.height) * (1 + 2 * MARGIN)) / scale, width, height)
  const centerX = (win.left + win.width / 2 - left) / scale
  const centerY = (win.top + win.height / 2 - top) / scale
  return {
    x: clamp(centerX - side / 2, 0, width - side),
    y: clamp(centerY - side / 2, 0, height - side),
    side,
  }
}

/**
 * While `active`, reads QR codes from the camera. Reads alternate between the
 * part of the video behind `frameRef` (sharp, what the user aims at) and the
 * whole frame scaled down (forgiving when the QR is held too close or isn't
 * centred). Reads never overlap. `onRead` gets each decoded text; returning
 * true means "taken" and stops the loop, so only the first result is handled.
 */
export function useQrDetection({
  videoRef,
  frameRef,
  active,
  onRead,
}: {
  videoRef: React.RefObject<HTMLVideoElement | null>
  frameRef: React.RefObject<HTMLElement | null>
  active: boolean
  onRead: (text: string) => boolean
}) {
  const read = useEffectEvent(onRead)

  useEffect(() => {
    const video = videoRef.current
    const frame = frameRef.current
    if (!active || !video || !frame) return
    const canvas = document.createElement("canvas")
    const ctx = canvas.getContext("2d", { willReadFrequently: true })
    const whole = document.createElement("canvas")
    const wholeCtx = whole.getContext("2d", { willReadFrequently: true })
    if (!ctx || !wholeCtx) return

    let stopped = false
    let reading = false
    let loading = false
    let nextAt = 0
    let detector: QrDetector | null = null
    let handle = 0
    let pass = 0
    // Once per new camera frame where supported, else once per paint.
    const perVideoFrame = typeof video.requestVideoFrameCallback === "function"

    const loadDetector = () => {
      loading = true
      getQrDetector().then(
        (loaded) => {
          detector = loaded
          loading = false
        },
        () => {
          loading = false
          nextAt = performance.now() + RETRY_MS
        }
      )
    }

    const tick = (now: number) => {
      if (stopped) return
      schedule()
      if (reading || loading || now < nextAt) return
      if (!detector) {
        loadDetector()
        return
      }
      const region = windowRegion(video, frame)
      if (!region) return
      nextAt = now + READ_EVERY_MS

      let target: HTMLCanvasElement
      try {
        if (pass++ % 2 === 0) {
          const size = Math.max(1, Math.round(Math.min(region.side, MAX_SIDE)))
          if (canvas.width !== size) {
            canvas.width = size
            canvas.height = size
          }
          ctx.drawImage(video, region.x, region.y, region.side, region.side, 0, 0, size, size)
          target = canvas
        } else {
          const scale = Math.min(1, FULL_MAX_SIDE / Math.max(video.videoWidth, video.videoHeight))
          const width = Math.max(1, Math.round(video.videoWidth * scale))
          const height = Math.max(1, Math.round(video.videoHeight * scale))
          if (whole.width !== width || whole.height !== height) {
            whole.width = width
            whole.height = height
          }
          wholeCtx.drawImage(video, 0, 0, width, height)
          target = whole
        }
      } catch {
        // The stream changed under us (e.g. restarting): try the next frame.
        return
      }

      reading = true
      detector.detect(target).then(
        (codes) => {
          reading = false
          if (stopped) return
          for (const { rawValue } of codes) {
            if (rawValue && read(rawValue)) {
              stopped = true
              return
            }
          }
        },
        () => {
          // e.g. the WebAssembly decoder is still loading, or a bad frame: keep going.
          reading = false
          nextAt = performance.now() + RETRY_MS
        }
      )
    }

    const schedule = () => {
      handle = perVideoFrame ? video.requestVideoFrameCallback(tick) : requestAnimationFrame(tick)
    }

    schedule()
    return () => {
      stopped = true
      if (perVideoFrame) video.cancelVideoFrameCallback(handle)
      else cancelAnimationFrame(handle)
    }
  }, [active, videoRef, frameRef])
}
