import { DatabaseZap } from "lucide-react"

import { strings } from "@/lib/strings"

/** Shown instead of the app when the Supabase env vars are missing. */
export function NotConfigured() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center px-6 py-16 text-center">
      <span className="grid size-16 place-items-center rounded-2xl bg-warning-soft text-warning-strong">
        <DatabaseZap className="size-8" aria-hidden />
      </span>
      <h1 className="mt-5 text-[24px] font-semibold tracking-tight">{strings.notConfigured.title}</h1>
      <p className="mt-2 max-w-[36ch] text-pretty text-muted-foreground">{strings.notConfigured.body}</p>
      <p className="mt-4 text-[14px] text-subtle-foreground">{strings.notConfigured.hint}</p>
    </main>
  )
}
