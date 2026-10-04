import "server-only"

import { headers } from "next/headers"

/**
 * Base URL that goes inside QR codes: NEXT_PUBLIC_APP_URL if set, otherwise the
 * address this request came in on (works on localhost, tunnels and Vercel).
 */
export async function getAppOrigin(): Promise<string> {
  const fromEnv = process.env.NEXT_PUBLIC_APP_URL?.trim().replace(/\/+$/, "")
  if (fromEnv) return fromEnv
  const h = await headers()
  const host = (h.get("x-forwarded-host") ?? h.get("host") ?? "localhost:3000").split(",")[0].trim()
  const forwardedProto = h.get("x-forwarded-proto")?.split(",")[0].trim()
  const proto = forwardedProto ?? (/^(localhost|127\.0\.0\.1)(:\d+)?$/.test(host) ? "http" : "https")
  return `${proto}://${host}`
}
