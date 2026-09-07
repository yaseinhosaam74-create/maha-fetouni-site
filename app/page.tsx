'use client'
import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import FullScreenPlayer from '@/components/FullScreenPlayer'
import { useLanguage } from '@/app/context/LanguageContext'
import { getSiteSettings } from '@/lib/firestore'

export default function HomePage() {
  const { language } = useLanguage()
  const [settings, setSettings] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const data = await getSiteSettings()
        setSettings(data)
      } catch (error) {
        console.error('Error fetching settings:', error)
      } finally {
        setLoading(false)
      }
    }
    fetchSettings()
  }, [])

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center text-camel-coat">جارٍ التحميل...</div>
  }

  const siteName = language === 'ar' ? settings?.siteNameAr || 'مهى فتوني' : settings?.siteNameEn || 'Maha Ftouni'
  const heroSubtitle = language === 'ar' ? settings?.heroSubtitleAr || 'المطربة اللبنانية' : settings?.heroSubtitleEn || 'Lebanese Singer'
  const heroSubtitle2 = language === 'ar' ? settings?.heroSubtitle2Ar || settings?.heroSubtitle2 || 'استمع واستمتع' : settings?.heroSubtitle2En || settings?.heroSubtitle2 || 'Listen and Enjoy'

  return (
    <motion.main
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="flex flex-col items-center justify-center min-h-screen p-4 md:p-8"
    >
      <motion.div
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2, duration: 0.5 }}
        className="text-center mb-8"
      >
        <h1 className="text-4xl md:text-6xl font-black text-camel-coat mb-2">{siteName}</h1>
        <p className="text-xl md:text-2xl text-boho mb-2">{heroSubtitle}</p>
        <p className="text-sm md:text-base text-boho/70 leading-relaxed">{heroSubtitle2}</p>
      </motion.div>
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.4, duration: 0.5 }}
      >
        <FullScreenPlayer />
      </motion.div>
    </motion.main>
  )
}