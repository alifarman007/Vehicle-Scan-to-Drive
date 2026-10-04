"use client"

import { KeyRound } from "lucide-react"
import { useRef, useState } from "react"

import { CodeInput, validateCodeInput } from "@/components/code-input"
import { Sheet } from "@/components/sheet"
import { Button } from "@/components/ui/button"
import { useAction } from "@/hooks/use-action"
import { errorMessage, postJson } from "@/lib/api-client"
import { setFlash } from "@/lib/flash"
import { firstName } from "@/lib/format"
import { homeFor } from "@/lib/routes"
import { strings } from "@/lib/strings"
import type { Me } from "@/lib/types"

/** "Already registered? Enter your code" — restores a profile on a new phone. */
export function RestoreSheet({
  open,
  onOpenChange,
  next,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  next: string | null
}) {
  const inputRef = useRef<HTMLInputElement>(null)
  return (
    <Sheet
      open={open}
      onOpenChange={onOpenChange}
      title={strings.restore.title}
      description={strings.restore.body}
      initialFocus={inputRef}
    >
      <RestoreForm inputRef={inputRef} next={next} />
    </Sheet>
  )
}

function RestoreForm({ inputRef, next }: { inputRef: React.RefObject<HTMLInputElement | null>; next: string | null }) {
  const [value, setValue] = useState("")
  const [error, setError] = useState<string | null>(null)

  const [pending, restore] = useAction(async () => {
    const check = validateCodeInput(value)
    if ("error" in check) {
      setError(check.error)
      return
    }
    try {
      const { me } = await postJson<{ me: Me }>("/api/profile/restore", { code: check.code })
      setFlash(strings.restore.welcomeBack(firstName(me.name)))
      // Full page load so no screen cached for the previous identity survives.
      window.location.replace(next ?? homeFor(me.role))
      return "stay-pending"
    } catch (err) {
      setError(errorMessage(err))
    }
  })

  return (
    <form
      noValidate
      onSubmit={(e) => {
        e.preventDefault()
        void restore()
      }}
      className="space-y-4"
    >
      <div className="space-y-2">
        <CodeInput
          ref={inputRef}
          value={value}
          onValueChange={(v) => {
            setValue(v)
            setError(null)
          }}
          invalid={Boolean(error)}
          aria-label={strings.restore.label}
          aria-describedby={error ? "restore-error" : undefined}
        />
        {error ? (
          <p id="restore-error" role="alert" className="text-center text-[14px] font-medium text-destructive">
            {error}
          </p>
        ) : null}
      </div>
      <Button type="submit" size="xl" loading={pending}>
        <KeyRound />
        {strings.restore.submit}
      </Button>
    </form>
  )
}
