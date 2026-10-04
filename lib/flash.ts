/**
 * A one-shot message that survives a full page load (shown as a toast on the
 * next screen). Used after identity changes, which reload the page.
 */
const KEY = "rp.flash"

export function setFlash(message: string) {
  try {
    sessionStorage.setItem(KEY, message)
  } catch {
    // Storage unavailable (private mode): the next screen speaks for itself.
  }
}

export function takeFlash(): string | null {
  try {
    const message = sessionStorage.getItem(KEY)
    if (message) sessionStorage.removeItem(KEY)
    return message
  } catch {
    return null
  }
}
