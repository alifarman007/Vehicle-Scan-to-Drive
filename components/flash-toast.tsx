"use client"

import { useEffect } from "react"
import { toast } from "sonner"

import { takeFlash } from "@/lib/flash"

/** Shows the message left by the previous page (see lib/flash.ts). */
export function FlashToast() {
  useEffect(() => {
    const message = takeFlash()
    if (!message) return
    const id = setTimeout(() => toast.success(message), 150)
    return () => clearTimeout(id)
  }, [])
  return null
}
