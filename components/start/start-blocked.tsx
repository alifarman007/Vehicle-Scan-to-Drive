"use client"

import {
  CircleUserRound,
  House,
  ScanQrCode,
  SearchX,
  TriangleAlert,
  UserRoundX,
  type LucideIcon,
} from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"

import { BottomBar } from "@/components/bottom-bar"
import { NavButton } from "@/components/nav-button"
import { buttonVariants } from "@/components/ui/button"
import type { ErrorCode } from "@/lib/errors"
import { goBackTo } from "@/lib/nav-history"
import { strings } from "@/lib/strings"

const ICONS: Partial<Record<ErrorCode, LucideIcon>> = {
  expected_passenger_code: ScanQrCode,
  passenger_busy: UserRoundX,
  code_not_found: SearchX,
  code_invalid: SearchX,
  own_code: CircleUserRound,
}

/**
 * A scanned code that can't start a trip (a driver QR, an unknown code, a
 * passenger already on another trip…): say why, then scan again or go back.
 */
export function StartBlocked({ code }: { code: ErrorCode }) {
  const router = useRouter()
  return (
    <main className="flex flex-1 animate-fade-in flex-col">
      <div role="alert" className="flex flex-1 flex-col items-center justify-center px-6 pt-safe text-center">
        <IconTile icon={ICONS[code] ?? TriangleAlert} />
        <h1 className="mt-5 text-[24px] leading-tight font-semibold tracking-tight">{strings.start.blockedTitle}</h1>
        <p className="mt-2 max-w-[32ch] text-[16px] text-pretty text-muted-foreground">{strings.errors[code]}</p>
      </div>
      <BottomBar>
        {/* Replace: this screen shouldn't come back when going Back from the scanner. */}
        <NavButton href="/scan" replace size="xl">
          <ScanQrCode />
          {strings.start.scanAgain}
        </NavButton>
        <Link
          href="/driver"
          draggable={false}
          onClick={(e) => {
            // Like the top bar's back arrow: pop when we came from there, else replace.
            e.preventDefault()
            goBackTo(router, "/driver")
          }}
          className={buttonVariants({ variant: "ghost", size: "xl", className: "touch-callout-none" })}
        >
          <House />
          {strings.start.backHome}
        </Link>
      </BottomBar>
    </main>
  )
}

function IconTile({ icon: Icon }: { icon: LucideIcon }) {
  return (
    <span className="grid size-16 place-items-center rounded-2xl bg-warning-soft text-warning-strong">
      <Icon className="size-8" aria-hidden />
    </span>
  )
}
