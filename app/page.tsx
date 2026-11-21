'use client'
import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Play } from 'lucide-react'
import { useAudio } from '@/components/AudioContext'
import { useLanguage } from '@/app/context/LanguageContext'
import { getSiteSettings } from '@/lib/firestore'

type SiteSettings = {
  siteNameAr?: string
  siteNameEn?: string
  heroSubtitleAr?: string
  heroSubtitleEn?: string
  heroSubtitle2Ar?: string
  heroSubtitle2En?: string
  heroSubtitle2?: string
}

export default function HomePage() {
  const { language } = useLanguage()
  const { openFullscreenPlayer, currentSong } = useAudio()
  const [settings, setSettings] = useState<SiteSettings | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const data = await getSiteSettings()
        setSettings(data as SiteSettings | null)
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
      <button
        onClick={() => openFullscreenPlayer()}
        className="flex items-center gap-3 bg-rubine hover:bg-tamarind text-white px-8 py-4 rounded-full text-lg font-bold shadow-2xl transition"
      >
        <Play size={22} fill="currentColor" />
        {language === 'ar' ? 'فتح المشغّل' : 'Open player'}
        {currentSong && <span className="text-white/70 text-sm">· {language === 'ar' ? currentSong.titleAr : currentSong.titleEn}</span>}
      </button>
    </motion.main>
  )
}