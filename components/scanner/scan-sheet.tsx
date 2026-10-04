"use client"

import { ArrowRight, Keyboard, ScanQrCode } from "lucide-react"
import { useState } from "react"

import { CodeInput, validateCodeInput } from "@/components/code-input"
import { Sheet } from "@/components/sheet"
import { Button } from "@/components/ui/button"
import { useAction } from "@/hooks/use-action"
import { strings } from "@/lib/strings"
import type { Role } from "@/lib/types"

const t = strings.scanner

export type ScanSheetView = "manual" | "error"

/**
 * One bottom sheet for both detours from scanning: "Type the code" and
 * "Couldn't use that code". From the error, "Type the code instead" turns
 * the open sheet into the code form rather than stacking a second sheet.
 * `view` and `message` are kept while it closes, so the content doesn't
 * change mid-animation.
 */
export function ScanSheet({
  open,
  view,
  message,
  role,
  inputRef,
  againRef,
  onOpenChange,
  onScanAgain,
  onTypeCode,
  onSubmitCode,
}: {
  open: boolean
  view: ScanSheetView
  message: string
  role: Role
  inputRef: React.RefObject<HTMLInputElement | null>
  againRef: React.RefObject<HTMLButtonElement | null>
  onOpenChange: (open: boolean) => void
  onScanAgain: () => void
  onTypeCode: () => void
  /** Resolves with a friendly error to show, or null when moving on. */
  onSubmitCode: (code: string) => Promise<string | null>
}) {
  const error = view === "error"
  return (
    <Sheet
      open={open}
      onOpenChange={onOpenChange}
      title={error ? t.errorTitle : t.manualTitle}
      description={error ? message : role === "driver" ? t.manualBodyDriver : t.manualBodyPassenger}
      initialFocus={error ? againRef : inputRef}
    >
      {error ? (
        <div className="flex flex-col gap-2">
          <Button ref={againRef} size="xl" onClick={onScanAgain}>
            <ScanQrCode />
            {t.scanAgain}
          </Button>
          <Button size="xl" variant="secondary" onClick={onTypeCode}>
            <Keyboard />
            {t.typeCode}
          </Button>
        </div>
      ) : (
        <ManualCodeForm inputRef={inputRef} onSubmitCode={onSubmitCode} />
      )}
    </Sheet>
  )
}

/** One big mono field. Format problems and server answers show right under it. */
function ManualCodeForm({
  inputRef,
  onSubmitCode,
}: {
  inputRef: React.RefObject<HTMLInputElement | null>
  onSubmitCode: (code: string) => Promise<string | null>
}) {
  const [value, setValue] = useState("")
  const [error, setError] = useState<string | null>(null)

  const [pending, submit] = useAction(async () => {
    const check = validateCodeInput(value)
    if ("error" in check) {
      setError(check.error)
      return
    }
    const failure = await onSubmitCode(check.code)
    // Success navigates away: keep the spinner until the next screen shows.
    if (!failure) return "stay-pending"
    setError(failure)
  })

  return (
    <form
      noValidate
      onSubmit={(e) => {
        e.preventDefault()
        void submit()
      }}
      className="space-y-4"
    >
      <div className="space-y-2">
        <CodeInput
          ref={inputRef}
          value={value}
          onValueChange={(next) => {
            setValue(next)
            setError(null)
          }}
          invalid={Boolean(error)}
          aria-label={t.manualTitle}
          aria-describedby={error ? "scan-code-error" : undefined}
        />
        {error ? (
          <p id="scan-code-error" role="alert" className="text-center text-[14px] font-medium text-pretty text-destructive">
            {error}
          </p>
        ) : null}
      </div>
      <Button type="submit" size="xl" loading={pending}>
        <ArrowRight />
        {t.manualSubmit}
      </Button>
    </form>
  )
}
