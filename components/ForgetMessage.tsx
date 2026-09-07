'use client'
import { useEffect } from 'react'
import { useLanguage } from '@/app/context/LanguageContext'

export default function ForgetMessage() {
  const { language } = useLanguage()

  useEffect(() => {
    const originalTitle = document.title

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        document.title = language === 'ar' ? 'لا تنسي مهى فتوني 💔' : "Don't Forget Maha Ftouni 💔"
      } else if (document.visibilityState === 'visible') {
        document.title = originalTitle
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      document.title = originalTitle
    }
  }, [language])

  return null
}