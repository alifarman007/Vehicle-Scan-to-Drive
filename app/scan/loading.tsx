import { ScannerClose, ScannerSurface } from "@/components/scanner/scanner-shell"

/** The dark camera surface appears at once while the scanner loads. */
export default function Loading() {
  return (
    <ScannerSurface aria-busy="true">
      {/* "/" redirects on the server to this device's home. */}
      <ScannerClose fallbackHref="/" />
    </ScannerSurface>
  )
}
