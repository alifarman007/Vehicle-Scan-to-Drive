import type { Role } from "./types"

export function homeFor(role: Role): "/driver" | "/passenger" {
  return role === "driver" ? "/driver" : "/passenger"
}

const BASE = "http://next.invalid"

/**
 * Only same-site paths are allowed as a post-onboarding destination. Browsers
 * drop tab/CR/LF and read "\" as "/" before resolving, so "/\t/evil.example"
 * would mean "//evil.example": reject those characters outright, then parse.
 */
export function safeNext(next: unknown): string | null {
  if (typeof next !== "string" || !next.startsWith("/")) return null
  if (/[\u0000- \u007F\\]/.test(next)) return null
  let url: URL
  try {
    url = new URL(next, BASE)
  } catch {
    return null
  }
  // Dot segments can collapse to a scheme-relative path ("/.//evil.example").
  if (url.origin !== BASE || url.pathname.startsWith("//")) return null
  return url.pathname + url.search + url.hash
}
