/*
 * QR decoding: the browser's native BarcodeDetector where it supports QR
 * (Android Chrome), otherwise the maintained `barcode-detector` ponyfill
 * (ZXing-C++ in WebAssembly — iPhone Safari, desktop). The .wasm file is
 * served from our own origin (/zxing, copied at build time), not a CDN.
 */

type Detector = { detect(source: ImageBitmapSource): Promise<Array<{ rawValue: string }>> }
type DetectorClass = {
  new (options: { formats: string[] }): Detector
  getSupportedFormats(): Promise<readonly string[]>
}

let detectorPromise: Promise<Detector> | null = null

async function createDetector(): Promise<Detector> {
  const Native = (globalThis as unknown as { BarcodeDetector?: DetectorClass }).BarcodeDetector
  if (Native) {
    try {
      const formats = await Native.getSupportedFormats()
      if (formats.includes("qr_code")) return new Native({ formats: ["qr_code"] })
    } catch {
      // Fall through to the WebAssembly decoder.
    }
  }
  const { BarcodeDetector, prepareZXingModule } = await import("barcode-detector/ponyfill")
  // Await the module here: if the .wasm fails to download (flaky mobile data),
  // this throws, the cached promise below is dropped, and the next attempt
  // passes fresh overrides, which makes zxing-wasm fetch it again.
  await prepareZXingModule({
    overrides: {
      locateFile: (path: string, prefix: string) => (path.endsWith(".wasm") ? `/zxing/${path}` : prefix + path),
    },
    fireImmediately: true,
  })
  return new BarcodeDetector({ formats: ["qr_code"] })
}

export function getQrDetector(): Promise<Detector> {
  if (!detectorPromise) {
    detectorPromise = createDetector().catch((err) => {
      detectorPromise = null
      throw err
    })
  }
  return detectorPromise
}

/** Start loading the decoder early (e.g. on the home screen) so scanning is instant. */
export function warmQrDetector() {
  void getQrDetector().catch(() => {})
}
