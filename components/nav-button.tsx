"use client"

import { useRouter } from "next/navigation"
import { useEffect, useTransition } from "react"

import { Button } from "@/components/ui/button"
import { goBackTo, replaceNavigation } from "@/lib/nav-history"

/**
 * A primary action that opens another screen. A real <button> (no long-press
 * link menu, no dragging) that prefetches its target and shows a spinner
 * until the next screen is ready.
 */
export function NavButton({
  href,
  replace = false,
  back = false,
  ...props
}: Omit<React.ComponentProps<typeof Button>, "onClick" | "loading"> & {
  href: string
  /** Swap the current history entry instead of adding one. */
  replace?: boolean
  /** Return to `href`: pop when it's the screen underneath, else replace. */
  back?: boolean
}) {
  const router = useRouter()
  const [navigating, startTransition] = useTransition()

  useEffect(() => {
    router.prefetch(href)
  }, [router, href])

  return (
    <Button
      {...props}
      loading={navigating}
      onClick={() =>
        startTransition(() => {
          if (back) goBackTo(router, href)
          else if (replace) {
            replaceNavigation(href)
            router.replace(href)
          } else router.push(href)
        })
      }
    />
  )
}
