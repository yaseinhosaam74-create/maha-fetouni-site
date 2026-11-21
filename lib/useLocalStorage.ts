'use client'
import { useCallback, useSyncExternalStore } from 'react'

const listeners = new Set<() => void>()

function createId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID()
  }
  return `device-${Date.now()}-${Math.random().toString(36).slice(2)}`
}

function readValue(key: string, fallback: string): string {
  if (typeof window === 'undefined') return fallback
  try {
    const current = window.localStorage.getItem(key)
    if (current !== null) return current
    if (key === 'deviceId') {
      const generated = createId()
      window.localStorage.setItem(key, generated)
      return generated
    }
    return fallback
  } catch {
    return fallback
  }
}

function subscribe(callback: () => void): () => void {
  listeners.add(callback)
  const handleStorage = () => callback()
  window.addEventListener('storage', handleStorage)
  return () => {
    listeners.delete(callback)
    window.removeEventListener('storage', handleStorage)
  }
}

export function useLocalStorage(key: string, fallback: string): [string, (value: string) => void] {
  const subscribeToStorage = useCallback((callback: () => void) => subscribe(callback), [])
  const getSnapshot = useCallback(() => readValue(key, fallback), [key, fallback])
  const getServerSnapshot = useCallback(() => fallback, [fallback])
  const value = useSyncExternalStore(subscribeToStorage, getSnapshot, getServerSnapshot)

  const setValue = useCallback(
    (next: string) => {
      if (typeof window === 'undefined') return
      try {
        window.localStorage.setItem(key, next)
      } catch {
        return
      }
      listeners.forEach((listener) => listener())
    },
    [key]
  )

  return [value, setValue]
}

export function useDeviceId(): string {
  return useLocalStorage('deviceId', '')[0]
}
