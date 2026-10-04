"use client"

import { useEffect, useEffectEvent } from "react"

type CloseWatcherLike = { onclose: (() => void) | null; destroy: () => void }

/**
 * Lets the Android Back gesture close a full-screen overlay (Chrome's
 * CloseWatcher API) instead of leaving the page. No-op where unsupported.
 */
export function useCloseWatcher(active: boolean, onClose: () => void) {
  const handleClose = useEffectEvent(onClose)
  useEffect(() => {
    const Watcher = (window as unknown as { CloseWatcher?: new () => CloseWatcherLike }).CloseWatcher
    if (!active || !Watcher) return
    let watcher: CloseWatcherLike
    try {
      watcher = new Watcher()
    } catch {
      return
    }
    watcher.onclose = () => handleClose()
    return () => watcher.destroy()
  }, [active])
}
