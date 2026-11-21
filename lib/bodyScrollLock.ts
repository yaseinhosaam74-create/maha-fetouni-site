let lockCount = 0

function applyUnlock() {
  if (typeof document === 'undefined') return
  document.body.style.overflow = ''
  document.documentElement.style.overflow = ''
  document.body.style.position = ''
  document.body.style.top = ''
  document.body.style.width = ''
}

export function lockBodyScroll() {
  if (typeof document === 'undefined') return
  if (lockCount === 0) {
    document.body.style.overflow = 'hidden'
    document.documentElement.style.overflow = 'hidden'
  }
  lockCount += 1
}

export function unlockBodyScroll() {
  if (typeof document === 'undefined') return
  lockCount = Math.max(0, lockCount - 1)
  if (lockCount === 0) applyUnlock()
}

export function forceUnlockBodyScroll() {
  if (typeof document === 'undefined') return
  lockCount = 0
  applyUnlock()
}
