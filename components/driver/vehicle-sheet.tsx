"use client"

import { Check } from "lucide-react"
import { useRef, useState } from "react"
import { toast } from "sonner"

import { Sheet } from "@/components/sheet"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useAction } from "@/hooks/use-action"
import { errorMessage, postJson } from "@/lib/api-client"
import { strings } from "@/lib/strings"
import type { Me } from "@/lib/types"

/** Drivers switch cars: tap the plate chip to change the vehicle number. */
export function VehicleSheet({
  open,
  onOpenChange,
  current,
  onSaved,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  current: string | null
  onSaved: (me: Me) => void
}) {
  const inputRef = useRef<HTMLInputElement>(null)
  return (
    <Sheet
      open={open}
      onOpenChange={onOpenChange}
      title={strings.driver.vehicleSheetTitle}
      description={strings.driver.vehicleSheetBody}
      initialFocus={inputRef}
    >
      <VehicleForm
        inputRef={inputRef}
        current={current}
        onSaved={(me) => {
          onSaved(me)
          onOpenChange(false)
        }}
      />
    </Sheet>
  )
}

function VehicleForm({
  inputRef,
  current,
  onSaved,
}: {
  inputRef: React.RefObject<HTMLInputElement | null>
  current: string | null
  onSaved: (me: Me) => void
}) {
  const [value, setValue] = useState(current ?? "")
  const [error, setError] = useState<string | null>(null)

  const [pending, save] = useAction(async () => {
    if (!value.trim()) {
      setError(strings.errors.vehicle_required)
      return
    }
    try {
      const { me } = await postJson<{ me: Me }>("/api/profile/vehicle", { vehicleNo: value })
      toast.success(strings.driver.vehicleUpdated)
      onSaved(me)
    } catch (err) {
      setError(errorMessage(err))
    }
  })

  return (
    <form
      noValidate
      onSubmit={(e) => {
        e.preventDefault()
        void save()
      }}
      className="space-y-4"
    >
      <div className="space-y-2">
        <Input
          ref={inputRef}
          value={value}
          onChange={(e) => {
            setValue(e.target.value.toUpperCase())
            setError(null)
          }}
          aria-label={strings.welcome.vehicle}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? "vehicle-error" : undefined}
          placeholder={strings.welcome.vehiclePlaceholder}
          autoCapitalize="characters"
          autoComplete="off"
          autoCorrect="off"
          spellCheck={false}
          enterKeyHint="done"
          maxLength={24}
          className="font-mono font-semibold tracking-wider uppercase"
        />
        {error ? (
          <p id="vehicle-error" className="text-[14px] font-medium text-destructive">
            {error}
          </p>
        ) : null}
      </div>
      <Button type="submit" size="xl" loading={pending}>
        <Check />
        {strings.common.save}
      </Button>
    </form>
  )
}
