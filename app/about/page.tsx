'use client'
import { useState, useEffect } from 'react'
import { getSiteSettings } from '@/lib/firestore'
import { useLanguage } from '@/app/context/LanguageContext'

export default function AboutPage() {
  const [aboutTextAr, setAboutTextAr] = useState('')
  const [aboutTextEn, setAboutTextEn] = useState('')
  const [loading, setLoading] = useState(true)
  const { language } = useLanguage()

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const settings = await getSiteSettings()
        if (settings) {
          setAboutTextAr(settings.aboutTextAr || '')
          setAboutTextEn(settings.aboutTextEn || '')
        }
      } catch (error) {
        console.error('Error fetching settings:', error)
      } finally {
        setLoading(false)
      }
    }
    fetchSettings()
  }, [])

  if (loading) {
    return <div className="p-8 text-center text-camel-coat">جارٍ التحميل...</div>
  }

  const aboutText = language === 'ar' ? aboutTextAr : aboutTextEn

  return (
    <div className="max-w-4xl mx-auto p-8">
      <h1 className="text-3xl font-bold text-camel-coat mb-8">
        {language === 'ar' ? 'نبذة عن مهى فتوني' : 'About Maha Ftouni'}
      </h1>
      {aboutText ? (
        <p className="text-camel-coat leading-relaxed whitespace-pre-line">{aboutText}</p>
      ) : (
        <p className="text-boho">لا توجد نبذة بعد</p>
      )}
    </div>
  )
}