/**
 * Personal codes: 6 characters, no look-alikes (no 0/O/1/I/L).
 * Stored as `K7M2QX`, shown as `K7M-2QX`, typed in any case.
 */
export const CODE_ALPHABET = "23456789ABCDEFGHJKMNPQRSTUVWXYZ"
export const CODE_LENGTH = 6

const CODE_RE = new RegExp(`^[${CODE_ALPHABET}]{${CODE_LENGTH}}$`)
const LOOKALIKES_RE = /[01ILO]/

/** Uppercases and strips spaces/dashes. Returns null unless it's a valid code. */
export function normalizeCode(input: string): string | null {
  const cleaned = input.toUpperCase().replace(/[\s-]/g, "")
  return CODE_RE.test(cleaned) ? cleaned : null
}

/** True when the text uses characters that never appear in codes (0, O, 1, I, L). */
export function hasLookalikes(input: string): boolean {
  return LOOKALIKES_RE.test(input.toUpperCase())
}

export function formatCode(code: string): string {
  return code.length === CODE_LENGTH ? `${code.slice(0, 3)}-${code.slice(3)}` : code
}

/** Live formatting for the code input: uppercase, alphanumerics only, dash after 3. */
export function formatCodeInput(input: string): string {
  const raw = input
    .toUpperCase()
    .replace(/[^0-9A-Z]/g, "")
    .slice(0, CODE_LENGTH)
  return raw.length > 3 ? `${raw.slice(0, 3)}-${raw.slice(3)}` : raw
}

/**
 * Reads a scanned QR payload. Accepts any URL ending in `/q/<code>` (any host,
 * so dev and prod QRs both work) or a bare code.
 */
export function extractCode(text: string): string | null {
  const value = text.trim()
  const match = value.match(/\/q\/([0-9A-Za-z-]{6,8})\/?(?:[?#].*)?$/)
  if (match) return normalizeCode(match[1])
  if (value.length > 8) return null
  return normalizeCode(value)
}

export function qrUrl(origin: string, code: string): string {
  return `${origin.replace(/\/+$/, "")}/q/${code}`
}

/** Unbiased random code using the Web Crypto API (works on server and client). */
export function generateCode(): string {
  const n = CODE_ALPHABET.length
  const limit = 256 - (256 % n)
  let out = ""
  while (out.length < CODE_LENGTH) {
    const bytes = crypto.getRandomValues(new Uint8Array(16))
    for (const b of bytes) {
      if (b < limit && out.length < CODE_LENGTH) out += CODE_ALPHABET[b % n]
    }
  }
  return out
}
