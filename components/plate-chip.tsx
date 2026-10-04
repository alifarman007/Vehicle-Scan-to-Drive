import { cn } from "cn"

const SIZES = {
  sm: "rounded-[6px] px-1.5 py-[3px] text-[12px] tracking-[0.06em]",
  md: "rounded-[7px] px-2 py-1 text-[13px] tracking-[0.08em]",
  lg: "rounded-[9px] px-3 py-1.5 text-[17px] tracking-[0.1em]",
} as const

/** A vehicle number styled like a license plate. */
export function PlateChip({
  value,
  size = "md",
  className,
}: {
  value: string
  size?: keyof typeof SIZES
  className?: string
}) {
  return (
    <span
      className={cn(
        "inline-flex max-w-full items-center border-2 border-plate-foreground bg-plate font-mono leading-none font-bold text-plate-foreground uppercase shadow-[inset_0_0_0_1.5px_var(--plate),inset_0_0_0_2.5px_oklch(0.141_0.005_285.823/0.14)]",
        SIZES[size],
        className
      )}
    >
      <span className="truncate">{value}</span>
    </span>
  )
}
