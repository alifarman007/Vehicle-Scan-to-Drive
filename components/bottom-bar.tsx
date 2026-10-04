import { cn } from "cn"

/**
 * Sticky bottom action area in thumb reach, padded for the iPhone home bar.
 * Sits at the end of the page's flex column: pinned when content is long,
 * resting at the bottom when it is short.
 */
export function BottomBar({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div
      className={cn(
        "no-print sticky bottom-0 z-20 mt-auto bg-[linear-gradient(to_top,var(--background)_72%,transparent)] px-4 pt-8 pb-safe",
        className
      )}
    >
      <div className="flex flex-col gap-2">{children}</div>
    </div>
  )
}
