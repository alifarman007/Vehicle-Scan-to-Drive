/**
 * The last two in-app paths, so "back"-style actions can pop the history
 * stack (like a native app) instead of stacking duplicate entries. Updated by
 * app/template.tsx on every screen change, by replaceNavigation() before a
 * router.replace(), and reset by browser back/forward (popstate), after which
 * the entry underneath is unknown.
 */
let current: string | null = null
let previous: string | null = null
let popped = false

if (typeof window !== "undefined") {
  window.addEventListener("popstate", () => {
    popped = true
  })
}

export function recordNavigation(path: string) {
  if (path === current) {
    popped = false
    return
  }
  previous = popped ? null : current
  current = path
  popped = false
}

/** Call right before router.replace(path): the current entry is swapped, the one underneath stays. */
export function replaceNavigation(path: string) {
  current = path
}

export function previousPath(): string | null {
  return previous
}

type BackRouter = { back: () => void; replace: (href: string) => void }

/** Return to `href`: pop when it's the screen underneath, otherwise replace (history never grows). */
export function goBackTo(router: BackRouter, href: string) {
  if (previous === href) {
    router.back()
  } else {
    replaceNavigation(href)
    router.replace(href)
  }
}
