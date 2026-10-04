import type { Metadata, Viewport } from "next"

import { ScanScreen } from "@/components/scanner/scan-screen"
import { requirePageProfile } from "@/lib/session"
import { strings } from "@/lib/strings"

export const metadata: Metadata = { title: strings.scanner.pageTitle }

/** Dark browser chrome around the dark camera screen (the --camera token). */
export const viewport: Viewport = { themeColor: "#09090b" }

/** One scanner for both roles: drivers scan Ride Passes, passengers scan driver QRs. */
export default async function ScanPage() {
  const me = await requirePageProfile()
  return <ScanScreen role={me.role} />
}
