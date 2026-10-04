"use client"

import { useState } from "react"

import { Avatar } from "@/components/avatar"
import { Wordmark } from "@/components/logo"
import { ProfileSheet } from "@/components/profile-sheet"
import { strings } from "@/lib/strings"
import type { Me } from "@/lib/types"

/** Home header: wordmark on the left, avatar (opens the profile sheet) on the right. */
export function AppHeader({ me, qrValue }: { me: Me; qrValue: string }) {
  const [open, setOpen] = useState(false)
  return (
    <>
      <header className="no-print sticky top-0 z-30 bg-background/85 pt-safe backdrop-blur-md">
        <div className="flex h-14 items-center justify-between pr-1.5 pl-4">
          <Wordmark />
          <button
            type="button"
            onClick={() => setOpen(true)}
            aria-label={strings.header.profile}
            className="grid size-12 place-items-center rounded-full transition-transform active:scale-95"
          >
            <Avatar name={me.name} />
          </button>
        </div>
      </header>
      <ProfileSheet open={open} onOpenChange={setOpen} me={me} qrValue={qrValue} />
    </>
  )
}
