import { ReceiptSkeleton } from "@/components/trip/trip-receipt"
import { Skeleton } from "@/components/ui/skeleton"

/** Matches the summary's centred check header (no top bar), so nothing jumps. */
export default function Loading() {
  return (
    <div className="flex flex-1 flex-col" aria-busy="true">
      <div className="flex flex-col items-center px-6 pt-[calc(env(safe-area-inset-top)+2rem)]">
        <Skeleton className="size-16 rounded-full bg-accent" />
        <Skeleton className="mt-4 h-7 w-44 bg-accent" />
      </div>
      <div className="px-4 pt-6">
        <ReceiptSkeleton />
      </div>
    </div>
  )
}
