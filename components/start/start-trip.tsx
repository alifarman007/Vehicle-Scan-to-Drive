"use client"

import { cn } from "cn"
import { BadgeCheck, Camera, Check, Gauge, LockKeyhole, Navigation, RotateCcw } from "lucide-react"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { toast } from "sonner"

import { Avatar } from "@/components/avatar"
import { BottomBar } from "@/components/bottom-bar"
import { LiveClock } from "@/components/live"
import { DashboardCamera } from "@/components/start/dashboard-camera"
import { StartBlocked } from "@/components/start/start-blocked"
import { StartSuccess } from "@/components/start/start-success"
import { TopBar } from "@/components/top-bar"
import { Button, buttonVariants } from "@/components/ui/button"
import { useAction } from "@/hooks/use-action"
import { ApiError, apiFetch, errorCode, errorMessage } from "@/lib/api-client"
import type { ErrorCode } from "@/lib/errors"
import { strings } from "@/lib/strings"
import type { StartTripResult } from "@/lib/types"

const t = strings.start

type Passenger = { name: string; idNumber: string | null; phone: string | null }
type Photo = { blob: Blob; url: string }

/** No retry can fix these: show the same screen as a blocked scan. */
const BLOCKING = new Set<ErrorCode>([
  "code_invalid",
  "code_not_found",
  "expected_passenger_code",
  "own_code",
  "passenger_busy",
  "wrong_role",
])

/** The server refused the photo itself, so it has to be taken again. */
const PHOTO_REFUSED = new Set<ErrorCode>(["photo_required", "photo_too_large"])

/**
 * Give up on a stalled upload so the driver can retry, but leave time for a
 * slow uplink: 20 s plus the photo at ~4 KB/s (about 2.5 min for 500 KB).
 * Retrying is safe: if the first request got through, the server returns
 * that same trip.
 */
const uploadTimeoutMs = (bytes: number) => 20_000 + Math.ceil(bytes / 4)

/**
 * After a driver scans a passenger: the verified passenger, a live dashboard
 * photo and the start time (server clock), then "Start journey". A failed
 * upload keeps the photo for a retry; success shows a short moment and goes
 * back to the trips list.
 */
export function StartTrip({
  passenger,
  passengerCode,
  renderedAt,
}: {
  passenger: Passenger
  passengerCode: string
  renderedAt: number
}) {
  const router = useRouter()
  const [photo, setPhoto] = useState<Photo | null>(null)
  const [cameraOpen, setCameraOpen] = useState(false)
  const [failed, setFailed] = useState(false)
  const [result, setResult] = useState<StartTripResult | null>(null)
  const [blocked, setBlocked] = useState<ErrorCode | null>(null)

  // Each photo has its own object URL: free it once replaced or on leaving.
  useEffect(() => {
    if (!photo) return
    return () => URL.revokeObjectURL(photo.url)
  }, [photo])

  const [starting, start] = useAction(async () => {
    if (!photo) return
    toast.dismiss("start-trip")
    const form = new FormData()
    form.set("passengerCode", passengerCode)
    form.set("photo", photo.blob, "start.jpg")
    try {
      const started = await apiFetch<StartTripResult>("/api/trips", {
        method: "POST",
        body: form,
        // Optional call: older iPhone Safari has no AbortSignal.timeout.
        signal: AbortSignal.timeout?.(uploadTimeoutMs(photo.blob.size)),
      })
      if ("vibrate" in navigator) navigator.vibrate?.(50)
      window.scrollTo({ top: 0 })
      setResult(started)
    } catch (err) {
      // This phone was reset or its profile removed: start over.
      if (err instanceof ApiError && err.status === 401) {
        router.replace("/welcome")
        return "stay-pending"
      }
      const code = errorCode(err)
      if (BLOCKING.has(code)) {
        window.scrollTo({ top: 0 })
        setBlocked(code)
        return
      }
      if (PHOTO_REFUSED.has(code)) {
        setPhoto(null)
        setFailed(false)
      } else {
        // Network or server trouble: keep the photo and offer Try again.
        setFailed(true)
      }
      // One id per action: a retry replaces the old error instead of stacking.
      toast.error(errorMessage(err), { id: "start-trip" })
    }
  })

  if (blocked) return <StartBlocked code={blocked} />
  if (result) return <StartSuccess result={result} passengerName={passenger.name} />

  return (
    <>
      <TopBar backHref="/driver" />
      <main className="flex flex-1 flex-col">
        <div className="px-5">
          <h1 className="text-[28px] leading-tight font-semibold tracking-tight">{t.title}</h1>
          <StartSteps current={photo ? 2 : 1} className="mt-4" />
        </div>

        <div className="space-y-3 px-4 pt-6 pb-2">
          <PassengerCard passenger={passenger} />
          {photo ? (
            <PhotoCard key={photo.url} url={photo.url} disabled={starting} onRetake={() => setCameraOpen(true)} />
          ) : (
            <PhotoPrompt onTake={() => setCameraOpen(true)} />
          )}
          <StartTimeCard renderedAt={renderedAt} />
        </div>

        <BottomBar>
          {photo && failed && !starting ? (
            <p className="text-center text-[14px] font-medium text-pretty text-destructive">{t.uploadFailed}</p>
          ) : null}
          <Button size="xl" disabled={!photo} loading={starting} onClick={() => void start()}>
            {failed ? <RotateCcw /> : <Navigation />}
            {starting ? t.uploading : failed ? strings.common.retry : t.startCta}
          </Button>
        </BottomBar>
      </main>

      <DashboardCamera
        open={cameraOpen}
        onOpenChange={setCameraOpen}
        onCapture={(blob) => {
          setPhoto({ blob, url: URL.createObjectURL(blob) })
          setFailed(false)
        }}
      />
    </>
  )
}

/** Scan ✓ → Photo → Start. `current` is the index of the step in progress. */
function StartSteps({ current, className }: { current: number; className?: string }) {
  const last = t.steps.length - 1
  return (
    <ol aria-label={t.stepsLabel} className={cn("flex items-center gap-2", className)}>
      {t.steps.map((label, i) => {
        const done = i < current
        const active = i === current
        return (
          <li
            key={label}
            aria-current={active ? "step" : undefined}
            className={cn("flex items-center gap-2", i < last && "flex-1")}
          >
            <span
              className={cn(
                "grid size-7 shrink-0 place-items-center rounded-full text-[13px] font-semibold tabular-nums transition-colors duration-200",
                done && "bg-success text-success-foreground",
                active && "bg-primary text-primary-foreground ring-4 ring-primary/10",
                !done && !active && "border-2 border-rule text-subtle-foreground"
              )}
            >
              {done ? <Check className="size-4 animate-check-in" strokeWidth={3} aria-hidden /> : i + 1}
            </span>
            <span
              className={cn(
                "text-[15px] font-semibold whitespace-nowrap",
                done ? "text-success-strong" : active ? "text-foreground" : "text-subtle-foreground"
              )}
            >
              {label}
              {done ? <span className="sr-only"> ({t.stepDone})</span> : null}
            </span>
            {i < last ? (
              <span
                aria-hidden
                className={cn(
                  "h-0.5 min-w-3 flex-1 rounded-full transition-colors duration-300",
                  done ? "bg-success" : "bg-rule"
                )}
              />
            ) : null}
          </li>
        )
      })}
    </ol>
  )
}

function PassengerCard({ passenger }: { passenger: Passenger }) {
  return (
    <div className="flex items-center gap-3.5 rounded-3xl border bg-card p-4 shadow-card">
      <Avatar name={passenger.name} size="lg" />
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-2">
          <p className="text-[13px] font-medium text-muted-foreground">{t.passenger}</p>
          <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-success-soft py-1 pr-2.5 pl-2 text-[13px] font-semibold text-success-strong">
            <BadgeCheck className="size-4" aria-hidden />
            {t.verified}
          </span>
        </div>
        <p className="mt-0.5 text-[20px] leading-tight font-semibold tracking-tight break-words">{passenger.name}</p>
        {passenger.idNumber ? (
          <p className="mt-1.5 flex min-w-0 items-baseline gap-2">
            <span className="text-[12px] font-semibold tracking-[0.12em] text-subtle-foreground uppercase">
              {strings.pass.idNumber}
            </span>
            <span className="min-w-0 truncate font-mono text-[15px] font-medium">{passenger.idNumber}</span>
          </p>
        ) : null}
      </div>
    </div>
  )
}

/** No photo yet: the whole dashed area opens the camera (a big thumb target). */
function PhotoPrompt({ onTake }: { onTake: () => void }) {
  return (
    <button
      type="button"
      onClick={onTake}
      className="group flex w-full flex-col items-center rounded-3xl border-2 border-dashed border-rule px-5 pt-6 pb-5 text-center outline-none transition-colors select-none focus-visible:ring-4 focus-visible:ring-ring/30 active:bg-card/70"
    >
      <span className="grid size-14 place-items-center rounded-2xl bg-card text-foreground shadow-card">
        <Gauge className="size-7" aria-hidden />
      </span>
      <span className="mt-3 text-[17px] font-semibold tracking-tight">{t.photoTitle}</span>
      <span className="mt-0.5 max-w-[30ch] text-[15px] text-pretty text-muted-foreground">{t.photoBody}</span>
      <span
        className={cn(buttonVariants({ variant: "secondary" }), "pointer-events-none mt-4 group-active:scale-[0.98]")}
      >
        <Camera />
        {t.photoCta}
      </span>
    </button>
  )
}

function PhotoCard({ url, disabled, onRetake }: { url: string; disabled: boolean; onRetake: () => void }) {
  return (
    <div className="animate-fade-in rounded-3xl border bg-card p-2 shadow-card">
      <div className="relative">
        {/* eslint-disable-next-line @next/next/no-img-element -- local blob: URL of the photo just taken */}
        <img
          src={url}
          alt={t.photoTitle}
          draggable={false}
          className="aspect-video w-full rounded-2xl bg-muted object-cover"
        />
        <button
          type="button"
          onClick={onRetake}
          disabled={disabled}
          className="absolute right-2 bottom-2 inline-flex h-12 items-center gap-2 rounded-full bg-black/55 pr-4 pl-3.5 text-[15px] font-semibold text-white outline-none backdrop-blur-md transition-[transform,opacity] duration-150 select-none focus-visible:ring-4 focus-visible:ring-white/50 active:scale-[0.97] disabled:opacity-50"
        >
          <RotateCcw className="size-[18px]" aria-hidden />
          {t.photoRetake}
        </button>
      </div>
      <p className="flex items-center gap-2 px-2 pt-2.5 pb-1.5 text-[15px] font-semibold text-success-strong">
        <span className="grid size-5 shrink-0 animate-check-in place-items-center rounded-full bg-success text-success-foreground">
          <Check className="size-3.5" strokeWidth={3} aria-hidden />
        </span>
        {t.photoAdded}
      </p>
    </div>
  )
}

/** Shown live, but the trip's real start time is the server's, taken on Start. */
function StartTimeCard({ renderedAt }: { renderedAt: number }) {
  return (
    <div className="rounded-3xl border bg-card px-5 py-4 shadow-card">
      <p className="text-[13px] font-medium text-muted-foreground">{t.startTime}</p>
      <LiveClock
        renderedAt={renderedAt}
        className="mt-0.5 block text-[34px] leading-tight font-semibold tracking-tight"
      />
      <p className="mt-1.5 flex items-center gap-1.5 text-[14px] text-muted-foreground">
        <LockKeyhole className="size-3.5 shrink-0" aria-hidden />
        {t.startTimeNote}
      </p>
    </div>
  )
}
