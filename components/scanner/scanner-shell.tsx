"use client"

import { cn } from "cn"
import { X } from "lucide-react"
import { useRouter } from "next/navigation"

import { Button } from "@/components/ui/button"
import { previousPath } from "@/lib/nav-history"
import { strings } from "@/lib/strings"

/**
 * The scanner's full-screen dark surface. Fixed over the app (centred in the
 * 440px column on desktop), above the app chrome but below bottom sheets
 * (z-50), so "Type the code" and error sheets open on top of it.
 */
export function ScannerSurface({ className, children, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      className={cn(
        "fixed inset-0 z-40 mx-auto flex h-dvh w-full max-w-[440px] flex-col overflow-hidden bg-camera text-white landscape:max-w-none",
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
}

/**
 * Top-left close, clear of the notch and above every scanner layer. Pops
 * back like a native close when we came from inside the app; otherwise
 * replaces, so history never grows.
 */
export function ScannerClose({ fallbackHref }: { fallbackHref: string }) {
  const router = useRouter()
  return (
    <div className="relative z-30 shrink-0 pt-safe">
      <div className="flex h-14 items-center px-2">
        <Button
          variant="glass"
          size="icon"
          aria-label={strings.scanner.close}
          onClick={() => {
            if (previousPath()) router.back()
            else router.replace(fallbackHref)
          }}
        >
          <X className="size-6" />
        </Button>
      </div>
    </div>
  )
}
