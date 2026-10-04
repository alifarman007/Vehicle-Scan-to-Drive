"use client"

import { useCallback, useRef, useState } from "react"

/**
 * Runs an async action with a pending flag and blocks double taps.
 * Return `"stay-pending"` from the action when it navigates away, so the
 * button keeps its spinner until the next screen appears.
 */
export function useAction<Args extends unknown[]>(
  action: (...args: Args) => Promise<void | "stay-pending">
): [pending: boolean, run: (...args: Args) => Promise<void>] {
  const [pending, setPending] = useState(false)
  const busy = useRef(false)

  const run = useCallback(
    async (...args: Args) => {
      if (busy.current) return
      busy.current = true
      setPending(true)
      let keep = false
      try {
        keep = (await action(...args)) === "stay-pending"
      } finally {
        if (!keep) {
          busy.current = false
          setPending(false)
        }
      }
    },
    [action]
  )

  return [pending, run]
}
