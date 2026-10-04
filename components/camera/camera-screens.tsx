"use client"

import { cn } from "cn"
import { Camera, CameraOff, Info, Keyboard, LoaderCircle, LockKeyhole, RotateCcw } from "lucide-react"

import { Button } from "@/components/ui/button"
import { type CameraErrorKind, devicePlatform, isInAppBrowser } from "@/lib/camera"
import { strings } from "@/lib/strings"

const t = strings.camera

/*
 * Full-screen states shown on the dark camera surface before or instead of
 * the live camera: the one-time "Allow camera" primer, starting, and the
 * help screens for denied / unavailable / busy / insecure cameras.
 */

function Shell({ children, actions }: { children: React.ReactNode; actions: React.ReactNode }) {
  return (
    <div className="flex min-h-0 flex-1 animate-fade-in flex-col text-white">
      {/* my-auto (not justify-center) keeps tall help content scrollable from
          its top on short phones; Safari before 17.6 ignores "safe" centring. */}
      <div className="flex min-h-0 flex-1 flex-col overflow-y-auto px-6 py-8">
        <div className="my-auto flex flex-col items-center text-center *:shrink-0">{children}</div>
      </div>
      <div className="flex shrink-0 flex-col gap-2 px-4 pt-3 pb-safe">{actions}</div>
    </div>
  )
}

function IconTile({ children, tone = "neutral" }: { children: React.ReactNode; tone?: "neutral" | "warning" }) {
  return (
    <span
      className={cn(
        "grid size-16 place-items-center rounded-2xl",
        tone === "warning" ? "bg-warning/20 text-warning" : "bg-white/10 text-white"
      )}
    >
      {children}
    </span>
  )
}

/** Shown once before the first camera use; skipped when already granted. */
export function CameraPrime({ onAllow, onTypeCode }: { onAllow: () => void; onTypeCode?: () => void }) {
  return (
    <Shell
      actions={
        <>
          <Button size="xl" variant="inverse" onClick={onAllow}>
            <Camera />
            {t.allowCta}
          </Button>
          {onTypeCode ? (
            <Button size="xl" variant="glass" onClick={onTypeCode}>
              <Keyboard />
              {strings.scanner.typeCode}
            </Button>
          ) : null}
        </>
      }
    >
      <IconTile>
        <Camera className="size-8" aria-hidden />
      </IconTile>
      <h2 className="mt-5 text-[24px] font-semibold tracking-tight">{t.allowTitle}</h2>
      <p className="mt-2 max-w-[32ch] text-[16px] text-pretty text-white/70">{t.allowBody}</p>
    </Shell>
  )
}

export function CameraStarting() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-3 text-white/70" role="status">
      <LoaderCircle className="size-7 animate-spin" aria-hidden />
      <p className="text-[15px]">{t.starting}</p>
    </div>
  )
}

const COPY: Record<CameraErrorKind, { title: string; body: string }> = {
  denied: { title: t.deniedTitle, body: t.deniedBody },
  unavailable: { title: t.unavailableTitle, body: t.unavailableBody },
  busy: { title: t.busyTitle, body: t.busyBody },
  insecure: { title: t.insecureTitle, body: t.insecureBody },
  unknown: { title: t.unavailableTitle, body: t.unavailableBody },
}

function Steps({ title, steps }: { title: string; steps: readonly string[] }) {
  return (
    <div className="w-full rounded-2xl bg-white/[0.07] p-4 text-left">
      <p className="text-[15px] font-semibold">{title}</p>
      <ol className="mt-2 space-y-1.5">
        {steps.map((step, i) => (
          <li key={step} className="flex gap-2.5 text-[15px] text-white/75">
            <span className="grid size-5 shrink-0 translate-y-0.5 place-items-center rounded-full bg-white/15 text-[12px] font-semibold text-white tabular-nums">
              {i + 1}
            </span>
            {step}
          </li>
        ))}
      </ol>
    </div>
  )
}

/**
 * The camera can't run: explain why, show how to turn it on in Chrome
 * (Android) and Safari (iPhone), and offer typing the code instead.
 */
export function CameraHelp({
  kind,
  onRetry,
  onTypeCode,
  fallback,
}: {
  kind: CameraErrorKind
  onRetry?: () => void
  onTypeCode?: () => void
  /** Extra action, e.g. the photo flow's "Open camera" file input. */
  fallback?: React.ReactNode
}) {
  const copy = COPY[kind]
  const platform = devicePlatform()
  const inApp = isInAppBrowser()
  const chrome = <Steps key="chrome" title={t.chromeSteps.title} steps={t.chromeSteps.steps} />
  const safari = <Steps key="safari" title={t.safariSteps.title} steps={t.safariSteps.steps} />

  return (
    <Shell
      actions={
        <>
          {fallback}
          {onRetry && kind !== "insecure" ? (
            <Button size="xl" variant={fallback ? "glass" : "inverse"} onClick={onRetry}>
              <RotateCcw />
              {t.retry}
            </Button>
          ) : null}
          {onTypeCode ? (
            <Button size="xl" variant="glass" onClick={onTypeCode}>
              <Keyboard />
              {strings.scanner.typeCode}
            </Button>
          ) : null}
        </>
      }
    >
      <IconTile tone="warning">
        {kind === "insecure" ? <LockKeyhole className="size-8" aria-hidden /> : <CameraOff className="size-8" aria-hidden />}
      </IconTile>
      <h2 className="mt-5 text-[24px] font-semibold tracking-tight">{copy.title}</h2>
      <p className="mt-2 max-w-[34ch] text-[16px] text-pretty text-white/70">{copy.body}</p>

      {inApp ? (
        <p className="mt-5 flex max-w-[36ch] items-start gap-2 rounded-2xl bg-warning/15 px-4 py-3 text-left text-[15px] text-warning">
          <Info className="mt-0.5 size-4 shrink-0" aria-hidden />
          {t.inAppHint}
        </p>
      ) : null}

      {kind === "denied" ? (
        <div className="mt-5 flex w-full max-w-[360px] flex-col gap-3">
          {platform === "ios" ? [safari, chrome] : [chrome, safari]}
        </div>
      ) : null}

      {!inApp && kind !== "insecure" ? (
        <p className="mt-5 max-w-[36ch] text-[14px] text-pretty text-white/55">{t.inAppHint}</p>
      ) : null}
    </Shell>
  )
}
