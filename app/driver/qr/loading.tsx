import { Skeleton } from "@/components/ui/skeleton"

export default function Loading() {
  return (
    <div className="flex flex-1 flex-col" aria-busy="true">
      <div className="h-14 pt-safe" />
      <div className="px-5">
        <Skeleton className="h-8 w-28 bg-accent" />
        <Skeleton className="mt-2 h-5 w-64 bg-accent" />
      </div>
      <div className="px-4 pt-5">
        <div className="rounded-3xl bg-card p-4 shadow-card">
          <Skeleton className="h-6 w-full bg-accent" />
          <Skeleton className="mx-auto mt-3 aspect-square w-full max-w-[280px] rounded-2xl bg-accent" />
          <Skeleton className="mx-auto mt-3 h-6 w-36 bg-accent" />
        </div>
      </div>
    </div>
  )
}
