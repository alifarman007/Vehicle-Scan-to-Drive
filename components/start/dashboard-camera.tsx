"use client"

import { Dialog } from "@base-ui/react/dialog"
import { cn } from "cn"
import { Camera, Check, Flashlight, FlashlightOff, LoaderCircle, RotateCcw, X } from "lucide-react"
import { useEffect, useRef, useState } from "react"
import { toast } from "sonner"

import { ZoomableImage } from "@/components/zoomable-image"
import { useCloseWatcher } from "@/hooks/use-close-watcher"
import { useThemeColor } from "@/hooks/use-theme-color"
import { CameraHelp, CameraPrime, CameraStarting } from "@/components/camera/camera-screens"
import { Button } from "@/components/ui/button"
import { useAction } from "@/hooks/use-action"
import { useCamera, useCameraGate } from "@/hooks/use-camera"
import { type CameraErrorKind, PHOTO_CONSTRAINTS } from "@/lib/camera"
import { captureVideoFrame, compressImageFile } from "@/lib/image"
import { strings } from "@/lib/strings"

const t = strings.start

type Shot = { blob: Blob; url: string }

/** Round icon button floating over the camera picture. */
const ROUND_BUTTON =
  "grid size-12 shrink-0 place-items-center rounded-full bg-black/35 text-white outline-none backdrop-blur-md transition-[background-color,transform] duration-150 active:scale-95 active:bg-white/25 focus-visible:ring-4 focus-visible:ring-white/40"

/**
 * Full-screen live camera for the dashboard photo: a guide frame, torch and
 * shutter, then a preview with Retake / Use photo. The camera (and its light)
 * goes off as soon as a frame is taken, when closed and when the page is
 * hidden. Only when the live camera can't run does it offer the phone's own
 * camera app, never the gallery.
 */
export function DashboardCamera({
  open,
  onOpenChange,
  onCapture,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** Gets the compressed JPEG; the camera closes itself right after. */
  onCapture: (photo: Blob) => void
}) {
  useCloseWatcher(open, () => onOpenChange(false))
  // A light browser bar above the black camera glares in a dark car.
  useThemeColor(open, "#09090b")
  return (
    <Dialog.Root open={open} onOpenChange={(next) => onOpenChange(next)}>
      <Dialog.Portal>
        <Dialog.Popup className="fixed inset-0 z-[60] mx-auto flex h-dvh w-full max-w-[440px] flex-col overflow-hidden bg-camera text-white landscape:max-w-none outline-none transition-opacity duration-200 data-ending-style:opacity-0 data-starting-style:opacity-0">
          <CameraBody
            open={open}
            onUse={(photo) => {
              onCapture(photo)
              onOpenChange(false)
            }}
          />
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  )
}

function CameraBody({ open, onUse }: { open: boolean; onUse: (photo: Blob) => void }) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const fileRef = useRef<HTMLInputElement>(null)
  const blinkRef = useRef<HTMLDivElement>(null)
  const gate = useCameraGate()
  const [shot, setShot] = useState<Shot | null>(null)
  // Set once the driver turns to the phone's camera app because the live
  // camera failed. The live camera then stays off (it would otherwise restart
  // when the page comes back from the camera app) until they tap Try again.
  const [fallback, setFallback] = useState<CameraErrorKind | null>(null)

  const camera = useCamera(videoRef, {
    enabled: open && gate.stage === "ready" && !shot && !fallback,
    constraints: PHOTO_CONSTRAINTS,
  })
  const live = camera.status === "live"

  // Free the preview's object URL once it's replaced or the camera closes.
  useEffect(() => {
    if (!shot) return
    return () => URL.revokeObjectURL(shot.url)
  }, [shot])

  const [capturing, capture] = useAction(async () => {
    const video = videoRef.current
    if (!video) return
    blink(blinkRef.current)
    // Freeze the picture: the encoder may need to draw it again, smaller.
    video.pause()
    try {
      const blob = await captureVideoFrame(video)
      // Showing the preview disables the camera, which stops every track (light off).
      setShot({ blob, url: URL.createObjectURL(blob) })
    } catch {
      video.play().catch(() => {})
      toast.error(t.captureFailed)
    }
  })

  const [reading, readFile] = useAction(async (file: File) => {
    try {
      const blob = await compressImageFile(file)
      setShot({ blob, url: URL.createObjectURL(blob) })
    } catch {
      toast.error(t.captureFailed)
    }
  })

  function openPhoneCamera(kind: CameraErrorKind) {
    setFallback(kind)
    fileRef.current?.click()
  }

  function retake() {
    setShot(null)
    // No live camera to go back to: reopen the phone's camera app instead.
    if (fallback) fileRef.current?.click()
  }

  const phoneCamera = (kind: CameraErrorKind) => (
    <>
      <p className="px-2 pb-1 text-center text-[14px] text-pretty text-white/70">{t.photoFallbackHint}</p>
      <Button size="xl" variant="inverse" loading={reading} onClick={() => openPhoneCamera(kind)}>
        <Camera />
        {t.photoFallback}
      </Button>
    </>
  )

  let content: React.ReactNode = null
  if (shot) {
    content = <Preview shot={shot} onRetake={retake} onUse={() => onUse(shot.blob)} />
  } else if (!open || gate.stage === "checking") {
    content = null
  } else if (fallback) {
    content = (
      <CameraHelp
        kind={fallback}
        onRetry={() => {
          setFallback(null)
          camera.retry()
        }}
        fallback={phoneCamera(fallback)}
      />
    )
  } else if (gate.stage === "prime") {
    content = <CameraPrime onAllow={gate.allow} />
  } else if (camera.status === "error") {
    const kind = camera.error ?? "unknown"
    content = <CameraHelp kind={kind} onRetry={camera.retry} fallback={phoneCamera(kind)} />
  } else if (live) {
    content = <LiveView capturing={capturing} onCapture={() => void capture()} />
  } else {
    content = <CameraStarting />
  }

  return (
    <>
      <video
        ref={videoRef}
        playsInline
        muted
        autoPlay
        aria-hidden
        className={cn(
          "pointer-events-none absolute inset-0 size-full object-cover transition-opacity duration-200",
          live ? "opacity-100" : "opacity-0"
        )}
      />
      <div ref={blinkRef} aria-hidden className="pointer-events-none absolute inset-0 z-30 bg-black opacity-0" />
      {live ? (
        <>
          {/* Keep the title, guide and shutter readable over a sunlit windshield. */}
          <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 z-[5] h-40 bg-linear-to-b from-black/60 to-transparent" />
          <div aria-hidden className="pointer-events-none absolute inset-x-0 bottom-0 z-[5] h-44 bg-linear-to-t from-black/60 to-transparent" />
        </>
      ) : null}

      <header className="relative z-20 shrink-0 pt-safe">
        <div className="flex h-14 items-center justify-between gap-2 px-2">
          <Dialog.Close aria-label={t.closeCamera} className={ROUND_BUTTON}>
            <X className="size-6" />
          </Dialog.Close>
          <Dialog.Title className="min-w-0 truncate text-[17px] font-semibold [text-shadow:0_1px_3px_rgb(0_0_0/0.5)]">
            {t.cameraTitle}
          </Dialog.Title>
          {live && camera.torchSupported ? (
            <button
              type="button"
              onClick={() => void camera.toggleTorch()}
              aria-label={camera.torchOn ? strings.camera.torchOff : strings.camera.torchOn}
              className={cn(ROUND_BUTTON, camera.torchOn && "bg-white text-camera active:bg-white/80")}
            >
              {camera.torchOn ? <Flashlight className="size-6" /> : <FlashlightOff className="size-6" />}
            </button>
          ) : (
            <span aria-hidden className="size-12 shrink-0" />
          )}
        </div>
      </header>

      {/* On short phones the help screen's middle part scrolls while its
          buttons stay put: min-h-0 lets it shrink, safe centring keeps its
          top reachable, and its items keep their size instead of squashing. */}
      <div className="relative z-10 flex min-h-0 flex-1 flex-col *:min-h-0 [&>*>.overflow-y-auto]:justify-center-safe [&>*>.overflow-y-auto>*]:shrink-0">
        {content}
      </div>

      {/* Only reached from the help screen, when the live camera can't run. */}
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        capture="environment"
        hidden
        tabIndex={-1}
        onChange={(e) => {
          const file = e.target.files?.[0]
          // Clear it, so taking a photo again still fires a change.
          e.target.value = ""
          if (file) void readFile(file)
        }}
      />
    </>
  )
}

function LiveView({ capturing, onCapture }: { capturing: boolean; onCapture: () => void }) {
  return (
    <div className="flex flex-1 animate-fade-in touch-none flex-col">
      {/* A size container, so the 4:3 frame (plus the line above it) fits
          whichever way the phone is held. Without cq units it's full width. */}
      <div className="flex min-h-0 flex-1 flex-col items-center justify-center px-5 py-3 [container-type:size]">
        <p className="relative z-10 mb-4 max-w-[34ch] rounded-full bg-black/45 px-3.5 py-1.5 text-center text-[15px] leading-snug font-medium text-balance backdrop-blur-md">
          {t.photoGuide}
        </p>
        <div
          aria-hidden
          className="relative aspect-[4/3] w-full max-w-[min(400px,calc((100cqh_-_4.5rem)*4/3))] shrink-0 rounded-[26px] border border-white/40 shadow-[0_0_0_100vmax_rgb(0_0_0/0.5)] *:drop-shadow-[0_1px_2px_rgb(0_0_0/0.6)]"
        >
          <span className="absolute -top-0.5 -left-0.5 size-10 rounded-tl-[28px] border-t-[3px] border-l-[3px] border-white" />
          <span className="absolute -top-0.5 -right-0.5 size-10 rounded-tr-[28px] border-t-[3px] border-r-[3px] border-white" />
          <span className="absolute -bottom-0.5 -left-0.5 size-10 rounded-bl-[28px] border-b-[3px] border-l-[3px] border-white" />
          <span className="absolute -right-0.5 -bottom-0.5 size-10 rounded-br-[28px] border-r-[3px] border-b-[3px] border-white" />
        </div>
      </div>

      <div className="relative z-10 flex shrink-0 justify-center pt-2 pb-safe">
        <button
          type="button"
          onClick={onCapture}
          disabled={capturing}
          aria-label={t.photoCapture}
          aria-busy={capturing || undefined}
          className="group mb-3 grid size-[78px] place-items-center rounded-full border-4 border-white shadow-[0_2px_10px_rgb(0_0_0/0.45)] outline-none transition-transform duration-150 select-none focus-visible:ring-4 focus-visible:ring-white/40 active:scale-95"
        >
          <span className="grid size-[60px] place-items-center rounded-full bg-white text-camera transition-transform duration-150 group-active:scale-90">
            {capturing ? <LoaderCircle className="size-6 animate-spin" aria-hidden /> : null}
          </span>
        </button>
      </div>
    </div>
  )
}

function Preview({ shot, onRetake, onUse }: { shot: Shot; onRetake: () => void; onUse: () => void }) {
  return (
    <div className="flex flex-1 animate-fade-in flex-col">
      {/* Tap to zoom in and check the odometer is readable before using it. */}
      <div className="relative mx-4 mt-1 min-h-0 flex-1 overflow-hidden rounded-2xl">
        <ZoomableImage src={shot.url} alt={t.photoTitle} imageClassName="rounded-2xl" />
      </div>
      <p className="mx-auto max-w-[34ch] px-6 pt-4 text-center text-[15px] text-pretty text-white/75">
        {t.previewHint}
      </p>
      <div className="grid shrink-0 grid-cols-2 gap-2 px-4 pt-3 pb-safe">
        <Button size="xl" variant="glass" onClick={onRetake}>
          <RotateCcw />
          {t.photoRetake}
        </Button>
        <Button size="xl" variant="inverse" onClick={onUse}>
          <Check />
          {t.photoUse}
        </Button>
      </div>
    </div>
  )
}

/** A quick dark blink, like a shutter. Skipped when motion is reduced. */
function blink(el: HTMLElement | null) {
  if (!el || typeof el.animate !== "function") return
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return
  el.animate([{ opacity: 0.75 }, { opacity: 0 }], { duration: 240, easing: "ease-out" })
}

