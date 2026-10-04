/**
 * The last two in-app paths, so a back arrow can pop the history stack (like
 * a native app) instead of pushing a duplicate entry. Updated by app/template.tsx.
 */
let current: string | null = null
let previous: string | null = null

export function recordNavigation(path: string) {
  if (path === current) return
  previous = current
  current = path
}

export function previousPath(): string | null {
  return previous
}
