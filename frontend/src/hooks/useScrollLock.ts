import { useEffect } from 'react'

let activeLocksCount = 0

/**
 * Universal scroll & slider lock hook.
 * When isLocked is true, it attaches 'modal-open' and 'no-scrollbar' to both <html> and <body>,
 * completely hiding the vertical scrollbar slider and locking background scroll.
 * Uses a global reference counter so nested or multiple modals clean up accurately.
 */
export function useScrollLock(isLocked: boolean) {
  useEffect(() => {
    if (!isLocked) return

    activeLocksCount++
    if (activeLocksCount === 1) {
      document.documentElement.classList.add('modal-open', 'no-scrollbar')
      document.body.classList.add('modal-open', 'no-scrollbar')
    }

    return () => {
      activeLocksCount = Math.max(0, activeLocksCount - 1)
      if (activeLocksCount === 0) {
        document.documentElement.classList.remove('modal-open', 'no-scrollbar')
        document.body.classList.remove('modal-open', 'no-scrollbar')
      }
    }
  }, [isLocked])
}
