"use client"

import { usePathname } from "next/navigation"
import { useEffect } from "react"

import { recordNavigation } from "@/lib/nav-history"

/**
 * Keyed by path, so every screen change (including nested ones such as
 * /driver → /driver/qr) gets the short fade/slide in.
 */
export default function Template({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  useEffect(() => {
    recordNavigation(pathname)
  }, [pathname])

  return (
    <div key={pathname} className="flex flex-1 animate-screen-in flex-col">
      {children}
    </div>
  )
}
