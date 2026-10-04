import { House, SearchX } from "lucide-react"
import Link from "next/link"

import { BottomBar } from "@/components/bottom-bar"
import { buttonVariants } from "@/components/ui/button"
import { strings } from "@/lib/strings"

export default function NotFound() {
  return (
    <main className="flex flex-1 flex-col">
      <div className="flex flex-1 flex-col items-center justify-center px-6 pt-safe text-center">
        <span className="grid size-16 place-items-center rounded-2xl bg-card text-muted-foreground shadow-card">
          <SearchX className="size-8" aria-hidden />
        </span>
        <h1 className="mt-5 text-[24px] font-semibold tracking-tight">{strings.notFound.title}</h1>
        <p className="mt-2 max-w-[32ch] text-pretty text-muted-foreground">{strings.notFound.body}</p>
      </div>
      <BottomBar>
        <Link href="/" className={buttonVariants({ size: "xl" })}>
          <House />
          {strings.common.goHome}
        </Link>
      </BottomBar>
    </main>
  )
}
