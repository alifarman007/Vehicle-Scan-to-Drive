import { cn } from "cn"
import type { LucideIcon } from "lucide-react"

import { BottomBar } from "@/components/bottom-bar"
import { Wordmark } from "@/components/logo"

const TONES = {
  neutral: "bg-card text-muted-foreground shadow-card",
  success: "bg-success-soft text-success-strong",
  warning: "bg-warning-soft text-warning-strong",
  destructive: "bg-destructive-soft text-destructive",
} as const

export type ResultTone = keyof typeof TONES

/**
 * Full-screen outcome of opening a QR link: an icon tile, a title, one or two
 * lines, optional details, and the actions in thumb reach. Same shape as the
 * not-found and error screens. The wordmark matters here: people often arrive
 * from the phone's camera app, outside the app.
 */
export function ResultScreen({
  icon: Icon,
  tone = "neutral",
  title,
  body,
  children,
  actions,
}: {
  /** Left out when the details below carry the screen (the end-trip check). */
  icon?: LucideIcon
  tone?: ResultTone
  title: string
  body: string
  children?: React.ReactNode
  actions: React.ReactNode
}) {
  return (
    <>
      <header className="no-print pt-safe">
        <div className="flex h-14 items-center pl-4">
          <Wordmark />
        </div>
      </header>
      <main className="flex flex-1 flex-col">
        <div className="flex flex-1 flex-col items-center justify-center px-5 pt-2 pb-4 text-center">
          {Icon ? (
            <span className={cn("mb-5 grid size-16 shrink-0 place-items-center rounded-2xl", TONES[tone])}>
              <Icon className="size-8" aria-hidden />
            </span>
          ) : null}
          <h1 className="text-[26px] leading-tight font-semibold tracking-tight text-balance">{title}</h1>
          <p className="mt-2 max-w-[32ch] text-[16px] text-pretty text-muted-foreground">{body}</p>
          {children ? <div className="mt-6 flex w-full flex-col items-center">{children}</div> : null}
        </div>
        <BottomBar>{actions}</BottomBar>
      </main>
    </>
  )
}
