"use client"

import { useRouter } from "next/navigation"
import { useEffect, useTransition } from "react"

import { Button } from "@/components/ui/button"

/**
 * A primary action that opens another screen. A real <button> (no long-press
 * link menu, no dragging) that prefetches its target and shows a spinner
 * until the next screen is ready.
 */
export function NavButton({
  href,
  replace = false,
  ...props
}: Omit<React.ComponentProps<typeof Button>, "onClick" | "loading"> & { href: string; replace?: boolean }) {
  const router = useRouter()
  const [navigating, startTransition] = useTransition()

  useEffect(() => {
    router.prefetch(href)
  }, [router, href])

  return (
    <Button
      {...props}
      loading={navigating}
      onClick={() => startTransition(() => (replace ? router.replace(href) : router.push(href)))}
    />
  )
}
