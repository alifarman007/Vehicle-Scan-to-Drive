"use client"

import type * as React from "react"

import { Drawer, DrawerContent, DrawerDescription, DrawerTitle } from "@/components/ui/drawer"

/**
 * The app's bottom sheet (used instead of centred popups). Swipe down or tap
 * outside to close. Content unmounts when closed, so forms inside start fresh.
 * Fields stay above the software keyboard via `--drawer-keyboard-inset`.
 */
export function Sheet({
  open,
  onOpenChange,
  title,
  description,
  initialFocus,
  children,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: React.ReactNode
  description?: React.ReactNode
  initialFocus?: React.RefObject<HTMLElement | null>
  children: React.ReactNode
}) {
  return (
    <Drawer open={open} onOpenChange={(next) => onOpenChange(next)} showSwipeHandle>
      <DrawerContent initialFocus={initialFocus ?? false}>
        <div className="min-h-0 overflow-y-auto overscroll-contain px-5 pt-3 pb-[calc(var(--drawer-keyboard-inset,0px)+max(1.25rem,env(safe-area-inset-bottom)))]">
          <DrawerTitle className="text-[22px] leading-tight font-semibold tracking-tight">{title}</DrawerTitle>
          {description ? (
            <DrawerDescription className="mt-1.5 text-[15px] text-pretty text-muted-foreground">
              {description}
            </DrawerDescription>
          ) : null}
          <div className="mt-5">{children}</div>
        </div>
      </DrawerContent>
    </Drawer>
  )
}
