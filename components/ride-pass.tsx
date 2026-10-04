"use client"

import { cn } from "cn"
import { useState } from "react"

import { Wordmark } from "@/components/logo"
import { PlateChip } from "@/components/plate-chip"
import { QrFullscreen, QrImage } from "@/components/qr"
import { formatCode } from "@/lib/codes"
import { strings } from "@/lib/strings"
import type { Me } from "@/lib/types"

/**
 * The signature pass, styled like a wallet boarding pass: details on top, a
 * dashed tear line with round notches, then a big QR with the code under it.
 * Used for the passenger's Ride Pass and the driver's QR.
 */
export function RidePass({
  me,
  qrValue,
  caption,
  className,
}: {
  me: Me
  qrValue: string
  caption?: string
  className?: string
}) {
  const [fullscreen, setFullscreen] = useState(false)
  const isDriver = me.role === "driver"
  const code = formatCode(me.code)

  return (
    <figure className={cn("pass-shadow mx-auto w-full max-w-[360px]", className)}>
      <div className="notch-bottom rounded-t-[28px] bg-card px-5 pt-5 pb-6">
        <div className="flex items-center justify-between gap-3">
          <Wordmark small />
          <span className="text-[11px] font-semibold tracking-[0.16em] text-subtle-foreground uppercase">
            {isDriver ? strings.pass.driverLabel : strings.pass.rideLabel}
          </span>
        </div>

        <p className="mt-6 text-[11px] font-semibold tracking-[0.14em] text-subtle-foreground uppercase">
          {strings.pass.name}
        </p>
        <p className="mt-0.5 text-[26px] leading-tight font-semibold tracking-tight break-words">{me.name}</p>

        <dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-3">
          {/* Plates are long ("DHAKA METRO GA 11-2345"): give them the full row. */}
          <div className={isDriver ? "col-span-2 min-w-0" : "min-w-0"}>
            <dt className="text-[11px] font-semibold tracking-[0.14em] text-subtle-foreground uppercase">
              {isDriver ? strings.pass.vehicle : strings.pass.idNumber}
            </dt>
            <dd className="mt-1 truncate text-[16px] font-medium">
              {isDriver ? (
                me.vehicleNo ? (
                  <PlateChip value={me.vehicleNo} />
                ) : (
                  strings.pass.noId
                )
              ) : (
                <span className="font-mono">{me.idNumber || strings.pass.noId}</span>
              )}
            </dd>
          </div>
          <div className="min-w-0">
            <dt className="text-[11px] font-semibold tracking-[0.14em] text-subtle-foreground uppercase">
              {strings.pass.phone}
            </dt>
            <dd className="mt-1 truncate text-[16px] font-medium tabular-nums">{me.phone || strings.pass.noId}</dd>
          </div>
        </dl>
      </div>

      <div className="notch-top relative rounded-b-[28px] bg-card px-5 pt-5 pb-5">
        <div aria-hidden className="absolute inset-x-[22px] top-0 border-t-2 border-dashed border-rule" />
        <button
          type="button"
          onClick={() => setFullscreen(true)}
          aria-label={strings.pass.tapToEnlarge}
          className="mx-auto block w-full max-w-[300px] rounded-2xl transition-transform duration-150 outline-none focus-visible:ring-4 focus-visible:ring-ring/30 active:scale-[0.985]"
        >
          <QrImage value={qrValue} margin={2} title={strings.pass.qrAlt(code)} />
        </button>
        <p className="mt-1.5 pl-[0.28em] text-center font-mono text-[24px] font-semibold tracking-[0.28em]">{code}</p>
        <p className="mt-1 text-center text-[15px] text-muted-foreground">
          {caption ?? (isDriver ? strings.pass.driverScanHint : strings.pass.showDriver)}
        </p>
      </div>

      <QrFullscreen open={fullscreen} onOpenChange={setFullscreen} value={qrValue} code={me.code} name={me.name} />
    </figure>
  )
}
