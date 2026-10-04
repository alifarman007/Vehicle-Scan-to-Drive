import { Skeleton } from "@/components/ui/skeleton"

/** Header bar placeholder matching AppHeader. */
export function HeaderSkeleton() {
  return (
    <div className="pt-safe">
      <div className="flex h-14 items-center justify-between pr-2.5 pl-4">
        <div className="flex items-center gap-2">
          <Skeleton className="size-8 rounded-[10px] bg-accent" />
          <Skeleton className="h-5 w-20 bg-accent" />
        </div>
        <Skeleton className="size-10 rounded-full bg-accent" />
      </div>
    </div>
  )
}

export function PassSkeleton() {
  return (
    <div className="mx-auto w-full max-w-[360px] rounded-[28px] bg-card p-5 shadow-card">
      <Skeleton className="h-6 w-28 bg-accent" />
      <Skeleton className="mt-6 h-3 w-12 bg-accent" />
      <Skeleton className="mt-2 h-7 w-44 bg-accent" />
      <div className="mt-5 grid grid-cols-2 gap-4">
        <Skeleton className="h-9 bg-accent" />
        <Skeleton className="h-9 bg-accent" />
      </div>
      <div className="mt-6 border-t-2 border-dashed border-border pt-5">
        <Skeleton className="mx-auto aspect-square w-full max-w-[268px] rounded-2xl bg-accent" />
        <Skeleton className="mx-auto mt-3 h-6 w-36 bg-accent" />
      </div>
    </div>
  )
}

export function ListSkeleton({ rows = 3 }: { rows?: number }) {
  return (
    <div className="divide-y divide-border overflow-hidden rounded-2xl border bg-card">
      {Array.from({ length: rows }, (_, i) => (
        <div key={i} className="flex items-center gap-3 px-4 py-3.5">
          <Skeleton className="size-10 rounded-full bg-accent" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-32 bg-accent" />
            <Skeleton className="h-3.5 w-44 bg-accent" />
          </div>
        </div>
      ))}
    </div>
  )
}

export function HomeSkeleton() {
  return (
    <div className="flex flex-1 flex-col" aria-busy="true">
      <HeaderSkeleton />
      <div className="px-5 pt-1">
        <Skeleton className="h-8 w-40 bg-accent" />
        <Skeleton className="mt-2 h-5 w-28 bg-accent" />
      </div>
      <div className="px-4 pt-5">
        <PassSkeleton />
      </div>
      <div className="px-4 pt-9">
        <Skeleton className="mb-3 h-3.5 w-28 bg-accent" />
        <ListSkeleton />
      </div>
    </div>
  )
}
