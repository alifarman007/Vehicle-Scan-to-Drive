import { Fragment } from "react"

import { BottomBar } from "@/components/bottom-bar"
import { TopBar } from "@/components/top-bar"
import { Skeleton } from "@/components/ui/skeleton"

/** Mirrors the start screen: title, steps, passenger, photo, start time, button. */
export default function Loading() {
  return (
    <>
      <TopBar backHref="/driver" />
      <main className="flex flex-1 flex-col" aria-busy="true">
        <div className="px-5">
          <Skeleton className="h-[35px] w-36 bg-accent" />
          <div className="mt-4 flex items-center gap-2">
            {[0, 1, 2].map((i) => (
              <Fragment key={i}>
                <Skeleton className="size-7 shrink-0 rounded-full bg-accent" />
                <Skeleton className="h-4 w-11 shrink-0 bg-accent" />
                {i < 2 ? <Skeleton className="h-0.5 min-w-3 flex-1 bg-accent" /> : null}
              </Fragment>
            ))}
          </div>
        </div>

        <div className="space-y-3 px-4 pt-6 pb-2">
          <div className="flex items-center gap-3.5 rounded-3xl border bg-card p-4 shadow-card">
            <Skeleton className="size-14 shrink-0 rounded-full bg-accent" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-3.5 w-20 bg-accent" />
              <Skeleton className="h-6 w-40 bg-accent" />
            </div>
          </div>

          <div className="flex flex-col items-center rounded-3xl border-2 border-dashed border-rule px-5 pt-6 pb-5">
            <Skeleton className="size-14 rounded-2xl bg-accent" />
            <Skeleton className="mt-3 h-5 w-36 bg-accent" />
            <Skeleton className="mt-2 h-4 w-52 bg-accent" />
            <Skeleton className="mt-4 h-12 w-36 rounded-xl bg-accent" />
          </div>

          <div className="rounded-3xl border bg-card px-5 py-4 shadow-card">
            <Skeleton className="h-3.5 w-20 bg-accent" />
            <Skeleton className="mt-2 h-9 w-44 bg-accent" />
            <Skeleton className="mt-2 h-4 w-52 bg-accent" />
          </div>
        </div>

        <BottomBar>
          <Skeleton className="mx-auto h-5 w-60 bg-accent" />
          <Skeleton className="h-14 w-full rounded-2xl bg-accent" />
        </BottomBar>
      </main>
    </>
  )
}
