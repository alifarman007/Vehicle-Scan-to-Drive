import { cn } from "cn"

/**
 * The scanning window: a clear rounded square cut out of a dark mask (the
 * mask is the window's own huge box-shadow, so the clear area is exactly
 * the element the decoder reads), white corner brackets that gently breathe,
 * and a moving scan line while reading. The brackets turn green once a code
 * is caught. Sized by its container's free height too (see ScanView), so it
 * never pushes the actions off short screens like the iPhone SE.
 */
export function ScanFrame({
  ref,
  scanning,
  caught,
  children,
}: {
  ref: React.Ref<HTMLDivElement>
  scanning: boolean
  caught: boolean
  children?: React.ReactNode
}) {
  return (
    <div
      ref={ref}
      className="relative size-[min(72vw,288px,calc(100cqh-3.75rem))] shrink-0 rounded-[28px] shadow-[0_0_0_100vmax_rgb(0_0_0/0.55)]"
    >
      <div
        aria-hidden
        className={cn(
          "absolute inset-0 animate-brackets transition-colors duration-200",
          caught ? "text-live" : "text-white"
        )}
      >
        <Bracket className="-top-[5px] -left-[5px]" />
        <Bracket className="-top-[5px] -right-[5px] rotate-90" />
        <Bracket className="-right-[5px] -bottom-[5px] rotate-180" />
        <Bracket className="-bottom-[5px] -left-[5px] -rotate-90" />
      </div>
      {scanning ? <ScanLine /> : null}
      {children}
    </div>
  )
}

/**
 * One corner, drawn for the top-left and rotated into place. The arc shares
 * the window's corner centre (28px radius), so the 5px stroke hugs the clear
 * area from just outside; round caps soften the ends.
 */
function Bracket({ className }: { className: string }) {
  return (
    <svg
      viewBox="0 0 56 56"
      fill="none"
      className={cn("absolute size-14 drop-shadow-[0_1px_2px_rgb(0_0_0/0.3)]", className)}
    >
      <path
        d="M2.5 52V33A30.5 30.5 0 0 1 33 2.5H52"
        stroke="currentColor"
        strokeWidth={5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

/** Decorative sweep: hidden under reduced motion. */
function ScanLine() {
  return (
    <div aria-hidden className="motion-decorative pointer-events-none absolute inset-0 overflow-hidden rounded-[28px]">
      {/* Full-height track, so the keyframes' 4%→94% moves the line through the window. */}
      <div className="absolute inset-0 animate-scan-line">
        <div className="mx-5 h-0.5 rounded-full bg-[linear-gradient(90deg,transparent,rgb(255_255_255/0.95)_22%,rgb(255_255_255/0.95)_78%,transparent)] shadow-[0_0_14px_2px_rgb(255_255_255/0.4)]" />
      </div>
    </div>
  )
}
