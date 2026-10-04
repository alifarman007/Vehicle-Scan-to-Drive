"use client"

import { Dialog } from "@base-ui/react/dialog"
import { cn } from "cn"
import { X } from "lucide-react"
import { QRCodeSVG } from "qrcode.react"

import { useCloseWatcher } from "@/hooks/use-close-watcher"
import { useWakeLock } from "@/hooks/use-wake-lock"
import { formatCode } from "@/lib/codes"
import { strings } from "@/lib/strings"

/**
 * Pure black on white. `margin` is the built-in quiet zone in modules: keep 4
 * when the QR stands alone; inside a white card with padding, 2 is enough
 * (the padding supplies the rest) and leaves room for a bigger symbol.
 */
export function QrImage({
  value,
  level = "M",
  margin = 4,
  className,
  title,
}: {
  value: string
  level?: "L" | "M" | "Q" | "H"
  margin?: number
  className?: string
  title?: string
}) {
  return (
    <QRCodeSVG
      value={value}
      level={level}
      marginSize={margin}
      bgColor="#ffffff"
      fgColor="#000000"
      size={512}
      title={title}
      className={cn("block h-auto w-full", className)}
    />
  )
}


/** Full-screen QR on pure white. Tap anywhere or press Back to close. */
export function QrFullscreen({
  open,
  onOpenChange,
  value,
  code,
  name,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  value: string
  code: string
  name?: string
}) {
  useWakeLock(open)
  useCloseWatcher(open, () => onOpenChange(false))
  return (
    <Dialog.Root open={open} onOpenChange={(next) => onOpenChange(next)}>
      <Dialog.Portal>
        <Dialog.Popup
          onClick={() => onOpenChange(false)}
          className="fixed inset-0 z-[70] flex cursor-pointer flex-col items-center justify-center bg-white px-6 pt-safe pb-safe text-black outline-none transition-opacity duration-200 data-ending-style:opacity-0 data-starting-style:opacity-0"
        >
          <Dialog.Title className="sr-only">{strings.pass.qrAlt(formatCode(code))}</Dialog.Title>
          <Dialog.Close
            aria-label={strings.common.close}
            className="absolute top-[calc(env(safe-area-inset-top)+8px)] right-3 grid size-12 place-items-center rounded-full text-black/70 active:bg-black/5"
          >
            <X className="size-6" />
          </Dialog.Close>
          <div className="w-[min(88vw,62dvh,460px)]">
            <QrImage value={value} title={strings.pass.qrAlt(formatCode(code))} />
          </div>
          <p className="mt-6 pl-[0.3em] font-mono text-[32px] font-semibold tracking-[0.3em]">{formatCode(code)}</p>
          {name ? <p className="mt-1 text-[20px] font-medium">{name}</p> : null}
          <p className="absolute inset-x-0 bottom-[max(1.5rem,env(safe-area-inset-bottom))] text-center text-[15px] text-subtle-foreground">
            {strings.pass.tapToClose}
          </p>
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
