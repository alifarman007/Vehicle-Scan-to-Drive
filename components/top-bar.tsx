"use client"

import { cn } from "cn"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"

import { goBackTo } from "@/lib/nav-history"
import { strings } from "@/lib/strings"

/** Sticky header for inner screens: back arrow, title, optional right slot. */
export function TopBar({
  title,
  backHref,
  right,
  className,
}: {
  title?: React.ReactNode
  backHref?: string
  right?: React.ReactNode
  className?: string
}) {
  const router = useRouter()
  return (
    <header className={cn("no-print sticky top-0 z-30 bg-background/85 pt-safe backdrop-blur-md", className)}>
      <div className="flex h-14 items-center gap-1 px-1.5">
        {backHref ? (
          <Link
            href={backHref}
            aria-label={strings.common.back}
            draggable={false}
            onClick={(e) => {
              // Pop when we came from there (like a native back arrow);
              // otherwise replace, so history never grows from going "back".
              e.preventDefault()
              goBackTo(router, backHref)
            }}
            className="grid size-12 shrink-0 touch-callout-none place-items-center rounded-full transition-colors active:bg-accent"
          >
            <ArrowLeft className="size-6" />
          </Link>
        ) : null}
        {title ? <p className="min-w-0 truncate px-1 text-[17px] font-semibold">{title}</p> : null}
        {right ? <div className="ml-auto flex items-center">{right}</div> : null}
      </div>
    </header>
  )
}

export function SectionTitle({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <h2
      className={cn(
        "mb-3 flex items-center gap-2 px-1 text-[13px] font-semibold tracking-[0.12em] text-subtle-foreground uppercase",
        className
      )}
    >
      {children}
    </h2>
  )
}
