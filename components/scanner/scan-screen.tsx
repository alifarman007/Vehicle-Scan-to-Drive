"use client"

import { cn } from "cn"
import { Flashlight, FlashlightOff, Keyboard, LoaderCircle, TriangleAlert } from "lucide-react"
import { useRouter } from "next/navigation"
import { useEffect, useRef, useState } from "react"
import { flushSync } from "react-dom"
import { toast } from "sonner"

import { CameraHelp, CameraPrime, CameraStarting } from "@/components/camera/camera-screens"
import { useQrDetection } from "@/components/scanner/qr-detection"
import { ScanFrame } from "@/components/scanner/scan-frame"
import { ScanSheet, type ScanSheetView } from "@/components/scanner/scan-sheet"
import { ScannerClose, ScannerSurface } from "@/components/scanner/scanner-shell"
import { Button } from "@/components/ui/button"
import { useCamera, useCameraGate } from "@/hooks/use-camera"
import { apiFetch, errorMessage, postJson } from "@/lib/api-client"
import { type CameraErrorKind, SCAN_CONSTRAINTS } from "@/lib/camera"
import { extractCode } from "@/lib/codes"
import { goBackTo, replaceNavigation } from "@/lib/nav-history"
import { warmQrDetector } from "@/lib/qr-decoder"
import { homeFor } from "@/lib/routes"
import { strings } from "@/lib/strings"
import type { PassengerCheck, Role, TripResult } from "@/lib/types"

const t = strings.scanner

/** "That QR isn't a RidePass code" stays this long after it was last seen. */
const NOT_A_CODE_MS = 2500

/**
 * A soft dark gradient behind text and buttons over the camera (direction and
 * extent added per use), so they stay readable when the camera sees a bright,
 * sunlit scene. A pseudo-element: it takes no layout space.
 */
const SCRIM =
  "relative z-10 before:pointer-events-none before:absolute before:inset-x-0 before:-z-10 before:to-transparent"

/**
 * scanning: looking for a code (the camera runs once allowed)
 * busy:     a code is being checked, or was accepted and the next screen is loading
 * failed:   a scanned code was turned down and the sheet says why
 * The camera only runs while scanning, so its light goes off the moment a
 * code is caught.
 */
type Phase = "scanning" | "busy" | "failed"
type Source = "scan" | "manual"

/** Where a code leads: drivers check the passenger, passengers end their trip. */
async function resolveCode(role: Role, code: string): Promise<{ href: string; notice?: string }> {
  if (role === "driver") {
    const lookup = await apiFetch<PassengerCheck>(`/api/lookup?code=${encodeURIComponent(code)}`)
    if (lookup.existingTripId) return { href: "/driver", notice: strings.start.alreadyStarted }
    return { href: `/driver/start/${code}` }
  }
  const { trip } = await postJson<TripResult>("/api/trips/end", { driverCode: code })
  return { href: `/trips/${trip.id}/done` }
}

/**
 * The one full-screen QR scanner for both roles: drivers scan a passenger's
 * Ride Pass to start a trip, passengers scan their driver's QR to end it.
 * Typing the code works at every stage, even without a camera.
 */
export function ScanScreen({ role }: { role: Role }) {
  const router = useRouter()
  const home = homeFor(role)
  const videoRef = useRef<HTMLVideoElement>(null)
  const frameRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const againRef = useRef<HTMLButtonElement>(null)
  /** Set by the first good read; cleared only when scanning again. */
  const caught = useRef(false)
  const mounted = useRef(false)

  const [phase, setPhase] = useState<Phase>("scanning")
  const [source, setSource] = useState<Source>("scan")
  const [sheet, setSheet] = useState<{ open: boolean; view: ScanSheetView; message: string }>({
    open: false,
    view: "manual",
    message: "",
  })
  // The camera help stays up (camera off) after "Type the code instead",
  // until "Try again", so it doesn't flicker behind the sheet.
  const [heldHelp, setHeldHelp] = useState<CameraErrorKind | null>(null)
  const notACode = useTransientFlag(NOT_A_CODE_MS)

  const gate = useCameraGate()
  const camera = useCamera(videoRef, {
    enabled: gate.stage === "ready" && phase === "scanning" && heldHelp === null,
    constraints: SCAN_CONSTRAINTS,
  })
  const live = camera.status === "live"
  // Reads pause while a sheet is open; a typed code goes through the sheet.
  const reading = live && phase === "scanning" && !sheet.open
  const help = camera.status === "error" ? (camera.error ?? "unknown") : heldHelp

  useEffect(() => {
    warmQrDetector()
    mounted.current = true
    return () => {
      mounted.current = false
    }
  }, [])

  useQrDetection({
    videoRef,
    frameRef,
    active: reading,
    onRead: (text) => {
      if (caught.current) return true
      const code = extractCode(text)
      if (!code) {
        notACode.show()
        return false
      }
      caught.current = true
      navigator.vibrate?.(50)
      void check(code, "scan")
      return true
    },
  })

  /** Runs a code through the role's flow. Resolves with an error message, or null when moving on. */
  async function check(code: string, from: Source): Promise<string | null> {
    setSource(from)
    setPhase("busy")
    notACode.hide()
    try {
      const { href, notice } = await resolveCode(role, code)
      // Closed meanwhile: don't pull the user somewhere else.
      if (mounted.current) {
        if (notice) toast(notice)
        // Back to the home we came from: pop rather than stack another copy.
        if (href === home) goBackTo(router, home)
        else {
          replaceNavigation(href)
          router.replace(href)
        }
      }
      return null
    } catch (err) {
      const message = errorMessage(err)
      if (from === "scan") {
        setPhase("failed")
        setSheet({ open: true, view: "error", message })
      } else {
        // Shown under the typed code; the camera comes back behind the sheet.
        resume()
      }
      return message
    }
  }

  /**
   * Turns the camera back on after a check. A fresh run (retry) so its status
   * and torch start over: the hook would otherwise report the previous run's
   * "live" before the new stream exists.
   */
  function resume() {
    caught.current = false
    setPhase("scanning")
    camera.retry()
  }

  function scanAgain() {
    resume()
    setSheet((s) => ({ ...s, open: false }))
  }

  function openManual() {
    flushSync(() => {
      notACode.hide()
      setSheet((s) => ({ ...s, open: true, view: "manual" }))
    })
    // Focus within this tap, so iPhone Safari brings up the keyboard.
    inputRef.current?.focus()
  }

  /** From the error sheet: the same sheet becomes the code form. */
  function switchToManual() {
    flushSync(() => {
      resume()
      setSheet((s) => ({ ...s, open: true, view: "manual" }))
    })
    // Focus within this tap, so iPhone Safari brings up the keyboard.
    inputRef.current?.focus()
  }

  function onSheetOpenChange(open: boolean) {
    if (open) return
    if (phase === "failed") scanAgain()
    // A typed code is being checked: stay open so its answer has a place to show.
    else if (phase !== "busy") setSheet((s) => ({ ...s, open: false }))
  }

  const busyOverlay = phase === "busy" && source === "scan"
  const busyLabel = role === "driver" ? t.checking : t.ending
  const showNotACode = notACode.on && reading
  const announcement = busyOverlay ? busyLabel : showNotACode ? t.notACode : reading ? t.hint : ""

  return (
    <ScannerSurface>
      {gate.stage === "ready" ? (
        // playsInline is required on iPhone; the camera hook attaches the stream.
        <video
          ref={videoRef}
          playsInline
          muted
          autoPlay
          aria-hidden
          className={cn(
            "pointer-events-none absolute inset-0 size-full object-cover transition-opacity duration-300",
            live ? "opacity-100" : "opacity-0"
          )}
        />
      ) : null}

      <ScannerClose fallbackHref={home} />

      {/* Children may shrink, so the camera help scrolls inside instead of overflowing. */}
      <div className="relative flex min-h-0 flex-1 flex-col *:min-h-0">
        {gate.stage === "prime" ? (
          <CameraPrime onAllow={gate.allow} onTypeCode={openManual} />
        ) : gate.stage === "ready" && help ? (
          <CameraHelp
            kind={help}
            onRetry={() => {
              setHeldHelp(null)
              camera.retry()
            }}
            onTypeCode={() => {
              flushSync(() => setHeldHelp(help))
              openManual()
            }}
          />
        ) : gate.stage === "ready" ? (
          <ScanView
            role={role}
            frameRef={frameRef}
            starting={camera.status === "starting"}
            reading={reading}
            caught={phase === "busy"}
            notACode={showNotACode}
            torch={
              camera.torchSupported
                ? { on: camera.torchOn, toggle: () => void camera.toggleTorch() }
                : null
            }
            onTypeCode={openManual}
          />
        ) : null}
      </div>

      {busyOverlay ? <Checking label={busyLabel} /> : null}

      <p role="status" aria-live="polite" className="sr-only">
        {announcement}
      </p>

      <ScanSheet
        open={sheet.open}
        view={sheet.view}
        message={sheet.message}
        role={role}
        inputRef={inputRef}
        againRef={againRef}
        onOpenChange={onSheetOpenChange}
        onScanAgain={scanAgain}
        onTypeCode={switchToManual}
        onSubmitCode={(code) => check(code, "manual")}
      />
    </ScannerSurface>
  )
}

/** Title, the window, a hint under it, and the bottom actions within thumb reach. */
function ScanView({
  role,
  frameRef,
  starting,
  reading,
  caught,
  notACode,
  torch,
  onTypeCode,
}: {
  role: Role
  frameRef: React.Ref<HTMLDivElement>
  starting: boolean
  reading: boolean
  caught: boolean
  notACode: boolean
  torch: { on: boolean; toggle: () => void } | null
  onTypeCode: () => void
}) {
  return (
    // No pinch, pan or pull-to-refresh on the camera view.
    <div className="flex flex-1 animate-fade-in touch-none flex-col select-none">
      {/* The scrim reaches up to the screen's top edge, behind the close button. */}
      <div
        className={cn(
          SCRIM,
          "shrink-0 px-6 pt-1 text-center before:-top-[calc(env(safe-area-inset-top)+3.5rem)] before:-bottom-6 before:bg-linear-to-b before:from-black/55 before:via-black/30 [@media(max-height:480px)]:hidden"
        )}
      >
        <h1 className="text-[24px] leading-tight font-semibold tracking-tight text-balance">
          {role === "driver" ? t.titleDriver : t.titlePassenger}
        </h1>
        <p className="mt-1.5 text-[15px] text-balance text-white/80">
          {role === "driver" ? t.subtitleDriver : t.subtitlePassenger}
        </p>
      </div>

      {/* A size container: the window takes what height is left after the hint (3.75rem). */}
      <div className="@container-size flex min-h-0 flex-1 flex-col items-center justify-center px-6 py-3">
        <ScanFrame ref={frameRef} scanning={reading} caught={caught}>
          {starting ? (
            <div className="absolute inset-0 flex">
              <CameraStarting />
            </div>
          ) : null}
        </ScanFrame>

        {/* Spoken through the screen's live region; this is the visual copy. */}
        <div aria-hidden className="relative z-10 mt-5 flex min-h-10 items-center justify-center">
          {notACode ? (
            <p
              key="not-a-code"
              className="flex animate-fade-in items-center gap-2 rounded-full bg-warning px-4 py-2 text-[15px] font-semibold text-warning-foreground shadow-float"
            >
              <TriangleAlert className="size-4 shrink-0" />
              {t.notACode}
            </p>
          ) : reading ? (
            <p
              key="hint"
              className="animate-fade-in rounded-full bg-black/40 px-4 py-2 text-[15px] font-medium text-white backdrop-blur-md"
            >
              {t.hint}
            </p>
          ) : null}
        </div>
      </div>

      <div
        className={cn(
          SCRIM,
          "flex shrink-0 items-center gap-3 px-4 pt-2 pb-safe before:-top-12 before:bottom-0 before:bg-linear-to-t before:from-black/55"
        )}
      >
        {torch ? (
          <Button
            variant={torch.on ? "inverse" : "glass"}
            size="icon"
            aria-label={torch.on ? strings.camera.torchOff : strings.camera.torchOn}
            onClick={torch.toggle}
            className="size-14 animate-fade-in rounded-2xl"
          >
            {torch.on ? <Flashlight className="size-6" /> : <FlashlightOff className="size-6" />}
          </Button>
        ) : null}
        <Button size="xl" variant="glass" onClick={onTypeCode} className="min-w-0 flex-1 shrink">
          <Keyboard />
          {t.typeCode}
        </Button>
      </div>
    </div>
  )
}

/** Full-screen "Checking…" once a code is caught. Fades in just after the brackets turn green. */
function Checking({ label }: { label: string }) {
  return (
    <div
      aria-hidden
      className="absolute inset-0 z-20 flex animate-fade-in flex-col items-center justify-center bg-camera/75 backdrop-blur-md [animation-delay:120ms]"
    >
      <span className="grid size-16 place-items-center rounded-2xl bg-white/10">
        <LoaderCircle className="size-8 animate-spin" />
      </span>
      <p className="mt-5 text-[18px] font-semibold tracking-tight">{label}</p>
    </div>
  )
}

/** On when asked; off again `ms` after the last ask (or right away on hide). */
function useTransientFlag(ms: number) {
  const [on, setOn] = useState(false)
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  useEffect(() => () => clearTimeout(timer.current), [])

  const show = () => {
    setOn(true)
    clearTimeout(timer.current)
    timer.current = setTimeout(() => setOn(false), ms)
  }
  const hide = () => {
    clearTimeout(timer.current)
    setOn(false)
  }
  return { on, show, hide }
}
