/*
 * The one place that talks to getUserMedia. Only one camera stream may exist
 * at a time: opening a new one stops the previous one first, and every stop
 * releases all tracks so the phone's camera light turns off.
 */

export type CameraErrorKind = "denied" | "unavailable" | "busy" | "insecure" | "unknown"

export class CameraError extends Error {
  constructor(public readonly kind: CameraErrorKind) {
    super(kind)
    this.name = "CameraError"
  }
}

/** Back camera, enough resolution to read a QR at arm's length. */
export const SCAN_CONSTRAINTS: MediaTrackConstraints = {
  facingMode: { ideal: "environment" },
  width: { ideal: 1280 },
  height: { ideal: 720 },
}

/** Back camera at 1920×1080 so the odometer is readable. */
export const PHOTO_CONSTRAINTS: MediaTrackConstraints = {
  facingMode: { ideal: "environment" },
  width: { ideal: 1920 },
  height: { ideal: 1080 },
}

let activeStream: MediaStream | null = null

export function cameraAvailable(): boolean {
  return typeof window !== "undefined" && window.isSecureContext && !!navigator.mediaDevices?.getUserMedia
}

function stopTracks(stream: MediaStream) {
  for (const track of stream.getTracks()) track.stop()
}

/** Stops a stream and forgets it if it was the active one. */
export function releaseCamera(stream: MediaStream | null | undefined) {
  if (!stream) return
  stopTracks(stream)
  if (activeStream === stream) activeStream = null
}

export function stopActiveCamera() {
  if (activeStream) stopTracks(activeStream)
  activeStream = null
}

function toCameraError(err: unknown): CameraError {
  if (err instanceof CameraError) return err
  const name = (err as { name?: string } | null)?.name
  if (name === "NotAllowedError" || name === "SecurityError" || name === "PermissionDeniedError") {
    return new CameraError("denied")
  }
  if (name === "NotFoundError" || name === "DevicesNotFoundError" || name === "OverconstrainedError") {
    return new CameraError("unavailable")
  }
  if (name === "NotReadableError" || name === "TrackStartError" || name === "AbortError") {
    return new CameraError("busy")
  }
  return new CameraError("unknown")
}

/** Opens the back camera (stopping any other stream first). */
export async function openCamera(constraints: MediaTrackConstraints): Promise<MediaStream> {
  if (!cameraAvailable()) throw new CameraError("insecure")
  stopActiveCamera()
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ video: constraints, audio: false })
    activeStream = stream
    return stream
  } catch (err) {
    const error = toCameraError(err)
    // Some phones reject size hints outright; retry with just the back camera.
    if (error.kind === "unavailable" && (constraints.width || constraints.height)) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { ideal: "environment" } },
          audio: false,
        })
        activeStream = stream
        return stream
      } catch (retryErr) {
        throw toCameraError(retryErr)
      }
    }
    throw error
  }
}

export type CameraPermission = "granted" | "denied" | "prompt" | "unknown"

/** Camera permission without prompting. "unknown" where the browser can't tell. */
export async function cameraPermission(): Promise<CameraPermission> {
  try {
    const status = await navigator.permissions.query({ name: "camera" as PermissionName })
    return status.state
  } catch {
    return "unknown"
  }
}

const PRIMED_KEY = "rp.cameraPrimed"

/** Remembers that the user has seen the "Allow camera" screen once. */
export function markCameraPrimed() {
  try {
    localStorage.setItem(PRIMED_KEY, "1")
  } catch {
    // Storage blocked: the primer simply shows again next time.
  }
}

export function wasCameraPrimed(): boolean {
  try {
    return localStorage.getItem(PRIMED_KEY) === "1"
  } catch {
    return false
  }
}

type TorchCapabilities = MediaTrackCapabilities & { torch?: boolean }

export function torchSupported(track: MediaStreamTrack | undefined): boolean {
  if (!track || typeof track.getCapabilities !== "function") return false
  return (track.getCapabilities() as TorchCapabilities).torch === true
}

export async function setTorch(track: MediaStreamTrack | undefined, on: boolean): Promise<boolean> {
  if (!track) return false
  try {
    await track.applyConstraints({ advanced: [{ torch: on } as MediaTrackConstraintSet] })
    return true
  } catch {
    return false
  }
}

/** Facebook, Messenger, Instagram, WhatsApp and similar in-app browsers. */
export function isInAppBrowser(): boolean {
  if (typeof navigator === "undefined") return false
  return /FBAN|FBAV|FB_IAB|FBIOS|Messenger|Instagram|WhatsApp|Line\/|MicroMessenger|; wv\)/i.test(navigator.userAgent)
}

export function devicePlatform(): "ios" | "android" | "other" {
  if (typeof navigator === "undefined") return "other"
  const ua = navigator.userAgent
  if (/iPhone|iPad|iPod/i.test(ua) || (/Macintosh/.test(ua) && navigator.maxTouchPoints > 1)) return "ios"
  if (/Android/i.test(ua)) return "android"
  return "other"
}
