/*
 * Photo compression before upload: at most 1600px on the long side, JPEG
 * around quality 0.8, stepping down until it's under ~500 KB (Vercel's
 * request limit is 4.5 MB). Always produces image/jpeg.
 */

const MAX_SIDE = 1600
const TARGET_BYTES = 500_000
const QUALITIES = [0.8, 0.72, 0.64, 0.56, 0.48]

function toBlob(canvas: HTMLCanvasElement, quality: number): Promise<Blob> {
  return new Promise((resolve, reject) =>
    canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error("encode failed"))), "image/jpeg", quality)
  )
}

function drawScaled(source: CanvasImageSource, width: number, height: number, maxSide: number) {
  const scale = Math.min(1, maxSide / Math.max(width, height))
  const canvas = document.createElement("canvas")
  canvas.width = Math.max(1, Math.round(width * scale))
  canvas.height = Math.max(1, Math.round(height * scale))
  const ctx = canvas.getContext("2d")
  if (!ctx) throw new Error("no 2d context")
  ctx.imageSmoothingQuality = "high"
  ctx.drawImage(source, 0, 0, canvas.width, canvas.height)
  return canvas
}

async function encode(source: CanvasImageSource, width: number, height: number): Promise<Blob> {
  let maxSide = MAX_SIDE
  let blob: Blob | null = null
  for (let pass = 0; pass < 3; pass++) {
    const canvas = drawScaled(source, width, height, maxSide)
    for (const quality of QUALITIES) {
      blob = await toBlob(canvas, quality)
      if (blob.size <= TARGET_BYTES) return blob
    }
    maxSide = Math.round(maxSide * 0.8)
  }
  return blob as Blob
}

/** Grabs the current video frame at full resolution and compresses it. */
export function captureVideoFrame(video: HTMLVideoElement): Promise<Blob> {
  const width = video.videoWidth
  const height = video.videoHeight
  if (!width || !height) return Promise.reject(new Error("video not ready"))
  return encode(video, width, height)
}

/** Fallback path: a photo from the phone's camera app (EXIF orientation applied). */
export async function compressImageFile(file: File): Promise<Blob> {
  if ("createImageBitmap" in window) {
    try {
      const bitmap = await createImageBitmap(file, { imageOrientation: "from-image" })
      try {
        return await encode(bitmap, bitmap.width, bitmap.height)
      } finally {
        bitmap.close()
      }
    } catch {
      // Fall back to an <img> decode below.
    }
  }
  const url = URL.createObjectURL(file)
  try {
    const img = new Image()
    img.decoding = "async"
    img.src = url
    await img.decode()
    return await encode(img, img.naturalWidth, img.naturalHeight)
  } finally {
    URL.revokeObjectURL(url)
  }
}
