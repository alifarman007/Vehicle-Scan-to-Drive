// Copies the ZXing WebAssembly decoder into public/zxing so the QR scanner
// loads it from our own origin instead of a CDN. Runs before dev and build.
// Resolved through barcode-detector, so the .wasm always matches its JS glue.
import { copyFileSync, mkdirSync } from "node:fs"
import { createRequire } from "node:module"
import { join } from "node:path"

const require = createRequire(import.meta.url)
const fromDetector = createRequire(require.resolve("barcode-detector/ponyfill"))
const source = fromDetector.resolve("zxing-wasm/reader/zxing_reader.wasm")
const targetDir = join(process.cwd(), "public", "zxing")

mkdirSync(targetDir, { recursive: true })
copyFileSync(source, join(targetDir, "zxing_reader.wasm"))
console.log("[copy-zxing-wasm] public/zxing/zxing_reader.wasm ready")
