"use client"

import { cn } from "cn"
import { useState } from "react"

import { PlateChip } from "@/components/plate-chip"
import { QrFullscreen, QrImage } from "@/components/qr"
import { formatCode } from "@/lib/codes"
import { strings } from "@/lib/strings"
import type { Me } from "@/lib/types"

/**
 * The driver's QR on its own: big, scannable, and short enough to sit fully
 * above the sticky bottom bar on small phones while trips are running.
 */
export function DriverQrCard({
  me,
  qrValue,
  showIdentity = false,
  className,
}: {
  me: Me
  qrValue: string
  showIdentity?: boolean
  className?: string
}) {
  const [fullscreen, setFullscreen] = useState(false)
  const code = formatCode(me.code)

  return (
    <figure className={cn("rounded-3xl border bg-card px-4 pt-4 pb-5 text-center shadow-card", className)}>
      {showIdentity ? (
        // Stacked: long names and plates ("DHAKA METRO GA 11-2345") both fit at 360px.
        <figcaption className="mb-3 flex flex-col items-center gap-1.5">
          <span className="max-w-full truncate text-[17px] font-semibold">{me.name}</span>
          {me.vehicleNo ? <PlateChip value={me.vehicleNo} size="sm" /> : null}
        </figcaption>
      ) : null}
      <button
        type="button"
        onClick={() => setFullscreen(true)}
        aria-label={strings.pass.tapToEnlarge}
        className="mx-auto block w-full max-w-[280px] rounded-2xl transition-transform duration-150 outline-none focus-visible:ring-4 focus-visible:ring-ring/30 active:scale-[0.985]"
      >
        <QrImage value={qrValue} margin={2} title={strings.pass.qrAlt(code)} />
      </button>
      <p className="mt-1.5 pl-[0.28em] font-mono text-[22px] font-semibold tracking-[0.28em]">{code}</p>
      <p className="mt-0.5 text-[15px] text-muted-foreground">{strings.pass.driverScanHint}</p>
      <QrFullscreen open={fullscreen} onOpenChange={setFullscreen} value={qrValue} code={me.code} name={me.name} />
    </figure>
  )
}
