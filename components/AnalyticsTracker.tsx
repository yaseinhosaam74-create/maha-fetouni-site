'use client'
import { useEffect } from 'react'
import { usePathname } from 'next/navigation'
import { logAnalyticsEvent } from '@/lib/analytics'

export default function AnalyticsTracker() {
  const pathname = usePathname()

  useEffect(() => {
    if (pathname) {
      logAnalyticsEvent('page_view', { path: pathname })
    }
  }, [pathname])

  return null
}