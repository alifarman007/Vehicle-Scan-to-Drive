"use client"

import { useEffect, useState, useSyncExternalStore } from "react"

import {
  CameraError,
  type CameraErrorKind,
  cameraPermission,
  markCameraPrimed,
  openCamera,
  releaseCamera,
  setTorch,
  torchSupported,
  wasCameraPrimed,
} from "@/lib/camera"

// --- Page visibility, with an epoch that changes on every hide/show ---------

let visibilityEpoch = 0
const visibilityListeners = new Set<() => void>()

function onVisibilityChange() {
  visibilityEpoch++
  visibilityListeners.forEach((l) => l())
}

function subscribeVisibility(listener: () => void) {
  if (visibilityListeners.size === 0) document.addEventListener("visibilitychange", onVisibilityChange)
  visibilityListeners.add(listener)
  return () => {
    visibilityListeners.delete(listener)
    if (visibilityListeners.size === 0) document.removeEventListener("visibilitychange", onVisibilityChange)
  }
}

const visibilitySnapshot = () => `${visibilityEpoch}:${document.visibilityState === "visible" ? 1 : 0}`

function usePageVisibility(): { visible: boolean; epoch: string } {
  const snapshot = useSyncExternalStore(subscribeVisibility, visibilitySnapshot, () => "0:1")
  return { visible: snapshot.endsWith(":1"), epoch: snapshot }
}

// --- Camera -----------------------------------------------------------------

export type CameraStatus = "off" | "starting" | "live" | "error"

type Session = { key: string; status: "live" | "error"; error: CameraErrorKind | null; torch: boolean }

/**
 * Runs the camera into `videoRef` while `enabled` and the page is visible.
 * Every track is stopped when disabled, on unmount and when the page is
 * hidden (it restarts when the page comes back). Late results from an
 * earlier start are discarded, so only one stream ever lives.
 */
export function useCamera(
  videoRef: React.RefObject<HTMLVideoElement | null>,
  { enabled, constraints }: { enabled: boolean; constraints: MediaTrackConstraints }
) {
  const { visible, epoch } = usePageVisibility()
  const [retry, setRetry] = useState(0)
  const [session, setSession] = useState<Session | null>(null)
  const [torch, setTorchState] = useState<{ key: string; on: boolean } | null>(null)

  const active = enabled && visible
  const runKey = `${epoch}|${retry}`

  useEffect(() => {
    if (!active) return
    const video = videoRef.current
    let cancelled = false
    let stream: MediaStream | null = null

    const fail = (kind: CameraErrorKind) => {
      if (!cancelled) setSession({ key: runKey, status: "error", error: kind, torch: false })
    }
    const onEnded = () => fail("busy")

    openCamera(constraints).then(
      async (opened) => {
        if (cancelled) {
          releaseCamera(opened)
          return
        }
        stream = opened
        const track = opened.getVideoTracks()[0]
        track?.addEventListener("ended", onEnded)
        if (video) {
          video.muted = true
          video.setAttribute("playsinline", "")
          video.srcObject = opened
          try {
            await video.play()
          } catch {
            // Autoplay can reject while the page is backgrounded; the stream still runs.
          }
        }
        if (!cancelled) setSession({ key: runKey, status: "live", error: null, torch: torchSupported(track) })
      },
      (err) => fail(err instanceof CameraError ? err.kind : "unknown")
    )

    return () => {
      cancelled = true
      // Forget this run, so turning the camera back on reads "starting" until
      // the new stream is really live (and the torch starts off again).
      setSession((s) => (s?.key === runKey ? null : s))
      setTorchState(null)
      if (stream) {
        stream.getVideoTracks()[0]?.removeEventListener("ended", onEnded)
        releaseCamera(stream)
        if (video && video.srcObject === stream) video.srcObject = null
      }
    }
  }, [active, runKey, constraints, videoRef])

  const current = active && session?.key === runKey ? session : null
  const status: CameraStatus = !active ? "off" : current ? current.status : "starting"
  const torchOn = torch?.key === runKey && torch.on

  async function toggleTorch() {
    const stream = videoRef.current?.srcObject
    const track = stream instanceof MediaStream ? stream.getVideoTracks()[0] : undefined
    if (await setTorch(track, !torchOn)) setTorchState({ key: runKey, on: !torchOn })
  }

  return {
    status,
    error: status === "error" ? (current?.error ?? "unknown") : null,
    torchSupported: status === "live" && Boolean(current?.torch),
    torchOn,
    toggleTorch,
    /** Try again after an error (e.g. after the user allowed the camera). */
    retry: () => setRetry((n) => n + 1),
  }
}

// --- "Allow camera" primer --------------------------------------------------

export type CameraGateStage = "checking" | "prime" | "ready"

/**
 * Before the first camera use, show a short "Allow camera" screen; skip it
 * when the permission is already granted (or the user has seen it before on
 * browsers that can't report the permission, like older iPhone Safari).
 */
export function useCameraGate(): { stage: CameraGateStage; allow: () => void } {
  const [stage, setStage] = useState<CameraGateStage>("checking")

  useEffect(() => {
    let cancelled = false
    cameraPermission().then((permission) => {
      if (cancelled) return
      if (permission === "granted" || permission === "denied") setStage("ready")
      else setStage(wasCameraPrimed() ? "ready" : "prime")
    })
    return () => {
      cancelled = true
    }
  }, [])

  return {
    stage,
    allow: () => {
      markCameraPrimed()
      setStage("ready")
    },
  }
}
