import { cn } from "cn"

/** Emerald disc whose check mark draws itself. */
export function SuccessCheck({ className }: { className?: string }) {
  return (
    <span className={cn("relative grid size-22 shrink-0 place-items-center", className)} aria-hidden>
      <span className="absolute inset-0 animate-check-in rounded-full bg-success-soft" />
      <svg viewBox="0 0 52 52" className="relative size-[76%] animate-check-in">
        <circle cx="26" cy="26" r="25" className="fill-success" />
        <path
          d="M15.5 27.5l7 7 14-15"
          fill="none"
          stroke="white"
          strokeWidth={4.5}
          strokeLinecap="round"
          strokeLinejoin="round"
          pathLength={1}
          strokeDasharray={1}
          className="animate-draw"
        />
      </svg>
    </span>
  )
}
