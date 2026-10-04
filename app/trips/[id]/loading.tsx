import { ReceiptSkeleton } from "@/components/trip/trip-receipt"
import { Skeleton } from "@/components/ui/skeleton"

/** Receipt-shaped placeholder for trip details and the trip summary (/done). */
export default function Loading() {
  return (
    <div className="flex flex-1 flex-col" aria-busy="true">
      <div className="pt-safe">
        <div className="h-14" />
      </div>
      <div className="px-5">
        <Skeleton className="h-8 w-40 bg-accent" />
      </div>
      <div className="px-4 pt-5">
        <ReceiptSkeleton />
      </div>
      <div className="px-4 pt-8">
        <Skeleton className="mb-3 ml-1 h-3.5 w-36 bg-accent" />
        <Skeleton className="aspect-video w-full rounded-2xl bg-accent" />
      </div>
    </div>
  )
}
