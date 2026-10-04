"use client"

import { House, RotateCcw, TriangleAlert } from "lucide-react"
import Link from "next/link"
import { useTransition } from "react"

import { BottomBar } from "@/components/bottom-bar"
import { Button, buttonVariants } from "@/components/ui/button"
import { strings } from "@/lib/strings"

export default function ErrorPage({ retry }: { error: Error & { digest?: string }; retry: () => void }) {
  const [retrying, startTransition] = useTransition()
  return (
    <main className="flex flex-1 flex-col">
      <div className="flex flex-1 flex-col items-center justify-center px-6 pt-safe text-center">
        <span className="grid size-16 place-items-center rounded-2xl bg-destructive-soft text-destructive">
          <TriangleAlert className="size-8" aria-hidden />
        </span>
        <h1 className="mt-5 text-[24px] font-semibold tracking-tight">{strings.errorPage.title}</h1>
        <p className="mt-2 max-w-[32ch] text-pretty text-muted-foreground">{strings.errorPage.body}</p>
      </div>
      <BottomBar>
        {/* retry() re-fetches the failed server render; reset() would only re-show it. */}
        <Button size="xl" loading={retrying} onClick={() => startTransition(() => retry())}>
          <RotateCcw />
          {strings.common.retry}
        </Button>
        <Link href="/" className={buttonVariants({ variant: "ghost", size: "xl" })}>
          <House />
          {strings.common.goHome}
        </Link>
      </BottomBar>
    </main>
  )
}
