import { Button as ButtonPrimitive } from "@base-ui/react/button"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "cn"
import { LoaderCircle } from "lucide-react"

const buttonVariants = cva(
  "group/button relative inline-flex shrink-0 select-none items-center justify-center gap-2 whitespace-nowrap border border-transparent font-semibold outline-none transition-[transform,background-color,box-shadow,opacity,color] duration-150 ease-out active:scale-[0.98] focus-visible:ring-4 focus-visible:ring-ring/30 disabled:pointer-events-none disabled:not-aria-busy:opacity-40 aria-busy:cursor-progress aria-busy:[&>svg:not(.btn-spinner)]:hidden [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-5",
  {
    variants: {
      variant: {
        // Disabled: solid grey, not see-through (it often sits over content in the bottom bar).
        default:
          "bg-primary text-primary-foreground shadow-button hover:bg-primary/90 disabled:not-aria-busy:bg-input disabled:not-aria-busy:opacity-100 disabled:not-aria-busy:shadow-none",
        secondary: "border-border bg-card text-foreground shadow-card hover:bg-muted",
        outline: "border-input bg-card text-foreground hover:bg-muted",
        ghost: "text-foreground hover:bg-accent/60",
        success: "bg-success text-success-foreground shadow-card hover:bg-success/90",
        destructive: "bg-destructive text-destructive-foreground shadow-card hover:bg-destructive/90",
        "destructive-soft": "bg-destructive-soft text-destructive-strong hover:bg-destructive-soft/70",
        glass:
          "border-white/15 bg-white/15 text-white backdrop-blur-md hover:bg-white/25 focus-visible:ring-white/40",
        /** Light button on the dark camera surface. */
        inverse: "bg-card text-card-foreground shadow-float hover:bg-card/90 focus-visible:ring-white/40",
        link: "h-auto px-0 font-medium text-foreground underline underline-offset-4",
      },
      size: {
        xl: "h-14 w-full rounded-2xl px-5 text-[17px]",
        lg: "h-12 rounded-2xl px-5 text-base",
        default: "h-12 rounded-xl px-4 text-[15px]",
        sm: "h-10 rounded-xl px-3 text-sm [&_svg:not([class*='size-'])]:size-4",
        icon: "size-12 rounded-full",
        "icon-sm": "size-10 rounded-full [&_svg:not([class*='size-'])]:size-5",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

type ButtonProps = ButtonPrimitive.Props &
  VariantProps<typeof buttonVariants> & {
    /** Shows a spinner and blocks taps until the work is done. */
    loading?: boolean
  }

function Button({ className, variant, size, loading = false, disabled, children, ...props }: ButtonProps) {
  return (
    <ButtonPrimitive
      data-slot="button"
      className={cn(buttonVariants({ variant, size }), className)}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      {...props}
    >
      {loading ? <LoaderCircle className="btn-spinner animate-spin" aria-hidden /> : null}
      {children}
    </ButtonPrimitive>
  )
}

export { Button, buttonVariants }
