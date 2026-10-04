"use client"

import { cn } from "cn"
import { ArrowLeft, ArrowRight, CarFront, ChevronRight, Ticket, type LucideIcon } from "lucide-react"
import { useSearchParams } from "next/navigation"
import { useRef, useState } from "react"
import { toast } from "sonner"

import { BottomBar } from "@/components/bottom-bar"
import { LogoMark } from "@/components/logo"
import { RidePass } from "@/components/ride-pass"
import { SuccessCheck } from "@/components/success-check"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RestoreSheet } from "@/components/welcome/restore-sheet"
import { useAction } from "@/hooks/use-action"
import { errorCode, errorMessage, postJson } from "@/lib/api-client"
import { qrUrl } from "@/lib/codes"
import { homeFor } from "@/lib/routes"
import { strings } from "@/lib/strings"
import type { Me, Role } from "@/lib/types"

const t = strings.welcome

/**
 * Onboarding: pick a role → name and details → "You're all set" with the QR.
 * The chosen role lives in the URL (?role=…) so the phone's Back gesture
 * returns to the role cards like a native app.
 */
export function WelcomeFlow({ next }: { next: string | null }) {
  const searchParams = useSearchParams()
  const roleParam = searchParams.get("role")
  const role: Role | null = roleParam === "driver" || roleParam === "passenger" ? roleParam : null
  const [created, setCreated] = useState<Me | null>(null)
  const [restoreOpen, setRestoreOpen] = useState(false)
  const pushedRole = useRef(false)

  function chooseRole(picked: Role) {
    const params = new URLSearchParams(window.location.search)
    params.set("role", picked)
    window.history.pushState(null, "", `?${params.toString()}`)
    pushedRole.current = true
    window.scrollTo({ top: 0 })
  }

  function backToRoles() {
    // Undo our own history entry when we made one; otherwise (e.g. after a
    // reload on ?role=…) just drop the param in place.
    if (pushedRole.current) {
      pushedRole.current = false
      window.history.back()
      return
    }
    const params = new URLSearchParams(window.location.search)
    params.delete("role")
    const query = params.toString()
    window.history.replaceState(null, "", query ? `?${query}` : window.location.pathname)
  }

  if (created) return <AllSet me={created} next={next} />
  if (role) return <DetailsStep key={role} role={role} next={next} onBack={backToRoles} onCreated={setCreated} />

  return (
    <main className="flex flex-1 animate-screen-in flex-col px-5 pt-safe">
      <div className="pt-12">
        <LogoMark className="size-14 rounded-[18px]" />
        <h1 className="mt-6 text-[28px] leading-[1.15] font-semibold tracking-tight">{t.title}</h1>
        <p className="mt-2 text-[17px] text-pretty text-muted-foreground">{t.subtitle}</p>
      </div>

      <div className="mt-8 grid gap-3" role="group" aria-label={t.roleQuestion}>
        <RoleCard
          icon={CarFront}
          title={t.driverCard.title}
          body={t.driverCard.body}
          onClick={() => chooseRole("driver")}
        />
        <RoleCard
          icon={Ticket}
          title={t.passengerCard.title}
          body={t.passengerCard.body}
          onClick={() => chooseRole("passenger")}
        />
      </div>

      <div className="mt-auto pt-10 pb-safe text-center">
        <button
          type="button"
          onClick={() => setRestoreOpen(true)}
          className="min-h-12 rounded-xl px-3 text-[15px] text-muted-foreground transition-colors active:bg-accent/60"
        >
          {t.restoreLink}{" "}
          <span className="font-semibold text-foreground underline underline-offset-4">{t.restoreLinkAction}</span>
        </button>
      </div>

      <RestoreSheet open={restoreOpen} onOpenChange={setRestoreOpen} next={next} />
    </main>
  )
}

function RoleCard({
  icon: Icon,
  title,
  body,
  onClick,
}: {
  icon: LucideIcon
  title: string
  body: string
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="group flex min-h-[112px] w-full items-center gap-4 rounded-3xl border bg-card p-5 text-left shadow-card transition-[transform,box-shadow] duration-150 outline-none focus-visible:ring-4 focus-visible:ring-ring/30 active:scale-[0.985]"
    >
      <span className="grid size-14 shrink-0 place-items-center rounded-2xl bg-primary text-primary-foreground">
        <Icon className="size-7" aria-hidden />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-[20px] leading-tight font-semibold tracking-tight">{title}</span>
        <span className="mt-1 block text-[15px] leading-snug text-pretty text-muted-foreground">{body}</span>
      </span>
      <ChevronRight className="size-5 shrink-0 text-subtle-foreground" aria-hidden />
    </button>
  )
}

type FormState = { name: string; phone: string; vehicleNo: string; idNumber: string }
type FieldErrors = Partial<Record<"name" | "vehicleNo", string>>

function DetailsStep({
  role,
  next,
  onBack,
  onCreated,
}: {
  role: Role
  next: string | null
  onBack: () => void
  onCreated: (me: Me) => void
}) {
  const [form, setForm] = useState<FormState>({ name: "", phone: "", vehicleNo: "", idNumber: "" })
  const [errors, setErrors] = useState<FieldErrors>({})

  const set = (key: keyof FormState) => (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = key === "vehicleNo" ? e.target.value.toUpperCase() : e.target.value
    setForm((f) => ({ ...f, [key]: value }))
    if (key === "name" || key === "vehicleNo") setErrors((er) => ({ ...er, [key]: undefined }))
  }

  /** Enter on a "next" field moves on instead of submitting early. */
  const focusOnEnter = (nextId: string) => (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault()
      document.getElementById(nextId)?.focus()
    }
  }

  const [pending, submit] = useAction(async () => {
    const found: FieldErrors = {}
    if (!form.name.trim()) found.name = strings.errors.name_required
    if (role === "driver" && !form.vehicleNo.trim()) found.vehicleNo = strings.errors.vehicle_required
    if (found.name || found.vehicleNo) {
      setErrors(found)
      document.getElementById(found.name ? "name" : "vehicleNo")?.focus()
      return
    }
    try {
      const { me } = await postJson<{ me: Me }>("/api/profile", { role, ...form })
      window.scrollTo({ top: 0 })
      onCreated(me)
    } catch (err) {
      const code = errorCode(err)
      if (code === "already_registered") {
        // A stale onboarding screen on a phone that already has a pass.
        window.location.replace(next ?? "/")
        return "stay-pending"
      }
      if (code === "name_required") setErrors({ name: strings.errors.name_required })
      else if (code === "vehicle_required") setErrors({ vehicleNo: strings.errors.vehicle_required })
      else toast.error(errorMessage(err))
    }
  })

  const isDriver = role === "driver"

  return (
    <form
      noValidate
      onSubmit={(e) => {
        e.preventDefault()
        void submit()
      }}
      className="flex flex-1 animate-screen-in flex-col"
    >
      <header className="sticky top-0 z-30 bg-background/85 pt-safe backdrop-blur-md">
        <div className="flex h-14 items-center gap-2 px-1.5">
          <button
            type="button"
            onClick={onBack}
            aria-label={strings.common.back}
            className="grid size-12 place-items-center rounded-full transition-colors active:bg-accent"
          >
            <ArrowLeft className="size-6" />
          </button>
          <StepDots current={2} total={2} />
        </div>
      </header>

      <div className="px-5 pt-2">
        <h1 className="text-[28px] leading-tight font-semibold tracking-tight">{t.detailsTitle[role]}</h1>
        <p className="mt-1.5 text-[16px] text-muted-foreground">{t.detailsSubtitle}</p>

        <div className="mt-7 space-y-5">
          <Field id="name" label={t.name} error={errors.name}>
            <Input
              id="name"
              name="name"
              value={form.name}
              onChange={set("name")}
              onKeyDown={focusOnEnter(isDriver ? "vehicleNo" : "phone")}
              placeholder={t.namePlaceholder}
              autoComplete="name"
              autoCapitalize="words"
              enterKeyHint="next"
              maxLength={60}
              aria-invalid={errors.name ? true : undefined}
              aria-describedby={errors.name ? "name-error" : undefined}
            />
          </Field>

          {isDriver ? (
            <Field id="vehicleNo" label={t.vehicle} hint={t.vehicleHint} error={errors.vehicleNo}>
              <Input
                id="vehicleNo"
                name="vehicleNo"
                value={form.vehicleNo}
                onChange={set("vehicleNo")}
                onKeyDown={focusOnEnter("phone")}
                placeholder={t.vehiclePlaceholder}
                autoComplete="off"
                autoCapitalize="characters"
                autoCorrect="off"
                spellCheck={false}
                enterKeyHint="next"
                maxLength={24}
                className="font-mono font-semibold tracking-wider uppercase placeholder:font-sans placeholder:font-normal placeholder:tracking-normal placeholder:normal-case"
                aria-invalid={errors.vehicleNo ? true : undefined}
                aria-describedby={errors.vehicleNo ? "vehicleNo-error" : "vehicleNo-hint"}
              />
            </Field>
          ) : null}

          <Field id="phone" label={t.phone} optional>
            <Input
              id="phone"
              name="phone"
              type="tel"
              inputMode="tel"
              value={form.phone}
              onChange={set("phone")}
              onKeyDown={isDriver ? undefined : focusOnEnter("idNumber")}
              placeholder={t.phonePlaceholder}
              autoComplete="tel"
              enterKeyHint={isDriver ? "done" : "next"}
              maxLength={20}
              className="tabular-nums"
            />
          </Field>

          {!isDriver ? (
            <Field id="idNumber" label={t.idNumber} optional>
              <Input
                id="idNumber"
                name="idNumber"
                value={form.idNumber}
                onChange={set("idNumber")}
                placeholder={t.idNumberPlaceholder}
                autoComplete="off"
                autoCapitalize="characters"
                autoCorrect="off"
                spellCheck={false}
                enterKeyHint="done"
                maxLength={32}
              />
            </Field>
          ) : null}
        </div>
      </div>

      <BottomBar>
        <Button type="submit" size="xl" loading={pending}>
          <ArrowRight />
          {t.create}
        </Button>
      </BottomBar>
    </form>
  )
}

function StepDots({ current, total }: { current: number; total: number }) {
  return (
    <div className="flex items-center gap-3">
      <div className="flex gap-1.5" aria-hidden>
        {Array.from({ length: total }, (_, i) => (
          <span
            key={i}
            className={cn(
              "h-1.5 rounded-full transition-all",
              i < current ? "w-6 bg-primary" : "w-3 bg-rule"
            )}
          />
        ))}
      </div>
      <span className="text-[14px] font-medium text-muted-foreground">{t.step(current, total)}</span>
    </div>
  )
}

function Field({
  id,
  label,
  optional,
  hint,
  error,
  children,
}: {
  id: string
  label: string
  optional?: boolean
  hint?: string
  error?: string
  children: React.ReactNode
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-baseline justify-between gap-2 px-0.5">
        <Label htmlFor={id}>{label}</Label>
        {optional ? <span className="text-[13px] text-subtle-foreground">{strings.common.optional}</span> : null}
      </div>
      {children}
      {error ? (
        <p id={`${id}-error`} role="alert" className="px-0.5 text-[14px] font-medium text-destructive">
          {error}
        </p>
      ) : hint ? (
        <p id={`${id}-hint`} className="px-0.5 text-[14px] text-muted-foreground">
          {hint}
        </p>
      ) : null}
    </div>
  )
}

function AllSet({ me, next }: { me: Me; next: string | null }) {
  const [leaving, setLeaving] = useState(false)
  const origin = process.env.NEXT_PUBLIC_APP_URL || window.location.origin

  return (
    <main className="flex flex-1 flex-col">
      <div className="flex flex-col items-center px-6 pt-[calc(env(safe-area-inset-top)+2.5rem)] text-center">
        <SuccessCheck />
        <h1 className="mt-5 animate-rise text-[28px] leading-tight font-semibold tracking-tight">{t.doneTitle}</h1>
        <p className="mt-1.5 max-w-[32ch] animate-rise text-[16px] text-pretty text-muted-foreground">
          {t.doneBody[me.role]}
        </p>
      </div>
      <div className="mt-6 animate-rise px-4 [animation-delay:120ms]">
        <RidePass me={me} qrValue={qrUrl(origin, me.code)} />
      </div>
      <BottomBar>
        <Button
          size="xl"
          loading={leaving}
          onClick={() => {
            setLeaving(true)
            // Full page load: drops router-cached screens rendered before this
            // phone had a pass, so Back can't show onboarding again.
            window.location.replace(next ?? homeFor(me.role))
          }}
        >
          <ArrowRight />
          {next ? t.continueCta : t.doneCta[me.role]}
        </Button>
      </BottomBar>
    </main>
  )
}
