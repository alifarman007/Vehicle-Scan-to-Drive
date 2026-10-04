import type { Metadata, Viewport } from "next"
import { Geist, Geist_Mono } from "next/font/google"
import { connection } from "next/server"

import { BfcacheGuard } from "@/components/bfcache-guard"
import { FlashToast } from "@/components/flash-toast"
import { NotConfigured } from "@/components/not-configured"
import { OfflineBanner } from "@/components/offline-banner"
import { Toaster } from "@/components/ui/sonner"
import { APP_NAME } from "@/lib/config"
import { isConfigured } from "@/lib/env"
import { strings } from "@/lib/strings"
import { serverTime } from "@/lib/time"

import "./globals.css"

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
})

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
})

export const metadata: Metadata = {
  title: { default: APP_NAME, template: `%s · ${APP_NAME}` },
  description: strings.app.description,
  applicationName: APP_NAME,
  appleWebApp: { capable: true, title: APP_NAME, statusBarStyle: "default" },
  formatDetection: { telephone: false },
}

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#f4f4f5",
  colorScheme: "light",
  interactiveWidget: "resizes-content",
}

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  // Rendered per request: the clock stamp below must be fresh, and env vars
  // are read at runtime.
  await connection()
  const configured = isConfigured()

  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable}`}>
      <head>
        {/* Server time at page load, so timers stay right even if the phone's clock is off. */}
        <script
          dangerouslySetInnerHTML={{ __html: `window.__rpClock={s:${serverTime()},c:Date.now()}` }}
        />
      </head>
      <body>
        <div className="app-frame relative mx-auto flex min-h-dvh w-full max-w-[440px] flex-col bg-background min-[480px]:shadow-[0_0_0_1px_rgb(9_9_11/0.06),0_30px_80px_-30px_rgb(9_9_11/0.35)]">
          {configured ? children : <NotConfigured />}
        </div>
        <Toaster />
        <OfflineBanner />
        <BfcacheGuard />
        <FlashToast />
      </body>
    </html>
  )
}
