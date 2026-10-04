"use client"

import { Copy, Printer, RotateCcw } from "lucide-react"
import Link from "next/link"
import { useState } from "react"
import { toast } from "sonner"

import { Avatar } from "@/components/avatar"
import { PlateChip } from "@/components/plate-chip"
import { QrFullscreen, QrImage } from "@/components/qr"
import { Sheet } from "@/components/sheet"
import { Button, buttonVariants } from "@/components/ui/button"
import { useAction } from "@/hooks/use-action"
import { errorMessage, postJson } from "@/lib/api-client"
import { formatCode } from "@/lib/codes"
import { setFlash } from "@/lib/flash"
import { strings } from "@/lib/strings"
import type { Me } from "@/lib/types"

/** Opened from the header avatar: who you are, your code and QR, and reset. */
export function ProfileSheet({
  open,
  onOpenChange,
  me,
  qrValue,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  me: Me
  qrValue: string
}) {
  const [confirming, setConfirming] = useState(false)
  const [qrOpen, setQrOpen] = useState(false)

  return (
    <>
      <Sheet
        open={open}
        onOpenChange={(next) => {
          onOpenChange(next)
          if (!next) setConfirming(false)
        }}
        title={confirming ? strings.profile.resetTitle : strings.profile.title}
        description={confirming ? strings.profile.resetBody(formatCode(me.code)) : undefined}
      >
        {confirming ? (
          <ResetConfirm onCancel={() => setConfirming(false)} />
        ) : (
          <ProfileDetails
            me={me}
            qrValue={qrValue}
            onShowQr={() => setQrOpen(true)}
            onReset={() => setConfirming(true)}
            onNavigate={() => onOpenChange(false)}
          />
        )}
      </Sheet>
      <QrFullscreen open={qrOpen} onOpenChange={setQrOpen} value={qrValue} code={me.code} name={me.name} />
    </>
  )
}

function ProfileDetails({
  me,
  qrValue,
  onShowQr,
  onReset,
  onNavigate,
}: {
  me: Me
  qrValue: string
  onShowQr: () => void
  onReset: () => void
  onNavigate: () => void
}) {
  const code = formatCode(me.code)

  async function copyCode() {
    try {
      await navigator.clipboard.writeText(code)
      toast.success(strings.common.copied)
    } catch {
      // Clipboard blocked: the code is on screen anyway.
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <Avatar name={me.name} size="lg" />
        <div className="min-w-0">
          <p className="truncate text-[20px] font-semibold tracking-tight">{me.name}</p>
          <span className="mt-1 inline-flex rounded-full bg-accent px-2.5 py-0.5 text-[13px] font-semibold">
            {strings.roles[me.role]}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-4 rounded-2xl border bg-card p-3 shadow-card">
        <button
          type="button"
          onClick={onShowQr}
          aria-label={strings.pass.tapToEnlarge}
          className="w-[88px] shrink-0 rounded-xl ring-1 ring-border transition-transform active:scale-[0.97]"
        >
          <QrImage value={qrValue} className="rounded-xl" />
        </button>
        <div className="min-w-0 flex-1">
          <p className="text-[13px] font-medium text-muted-foreground">{strings.profile.code}</p>
          <div className="-my-1 -mr-2.5 flex items-center justify-between gap-1">
            <p className="font-mono text-[21px] font-semibold tracking-[0.12em] whitespace-nowrap">{code}</p>
            <Button variant="ghost" size="icon" onClick={copyCode} aria-label={strings.common.copy}>
              <Copy className="size-[18px]" />
            </Button>
          </div>
          <p className="text-[13px] leading-snug text-muted-foreground">{strings.profile.codeHint}</p>
        </div>
      </div>

      <dl className="divide-y divide-border rounded-2xl border bg-card">
        <Row label={strings.profile.phone}>{me.phone || strings.profile.notSet}</Row>
        {me.role === "driver" ? (
          <Row label={strings.profile.vehicle}>
            {me.vehicleNo ? <PlateChip value={me.vehicleNo} size="sm" /> : strings.profile.notSet}
          </Row>
        ) : (
          <Row label={strings.profile.idNumber}>
            <span className="font-mono">{me.idNumber || strings.profile.notSet}</span>
          </Row>
        )}
      </dl>

      {me.role === "driver" ? (
        <Link
          href="/driver/qr"
          onClick={onNavigate}
          className={buttonVariants({ variant: "secondary", size: "lg", className: "w-full" })}
        >
          <Printer />
          {strings.profile.myQr}
        </Link>
      ) : null}

      <Button variant="destructive-soft" size="lg" className="w-full" onClick={onReset}>
        <RotateCcw />
        {strings.profile.reset}
      </Button>
    </div>
  )
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex min-h-12 items-center justify-between gap-4 px-4 py-2.5">
      <dt className="text-[15px] text-muted-foreground">{label}</dt>
      <dd className="min-w-0 truncate text-right text-[15px] font-medium tabular-nums">{children}</dd>
    </div>
  )
}

function ResetConfirm({ onCancel }: { onCancel: () => void }) {
  const [pending, reset] = useAction(async () => {
    try {
      await postJson("/api/profile/reset", {})
      setFlash(strings.profile.resetDone)
      // Full page load: Back must never show screens cached for this identity.
      window.location.replace("/welcome")
      return "stay-pending"
    } catch (err) {
      toast.error(errorMessage(err))
    }
  })

  return (
    <div className="space-y-2">
      <Button variant="destructive" size="xl" loading={pending} onClick={() => reset()}>
        <RotateCcw />
        {strings.profile.resetConfirm}
      </Button>
      <Button variant="ghost" size="xl" disabled={pending} onClick={onCancel}>
        {strings.common.cancel}
      </Button>
    </div>
  )
}
