'use client'
import { useEffect } from 'react'
import { usePathname } from 'next/navigation'
import { defaultSeoSettings, getSeoSettings } from '@/lib/seo'
import { useLanguage } from '@/app/context/LanguageContext'

type PageKey = keyof typeof defaultSeoSettings

function setMeta(name: string, content: string) {
  let element = document.querySelector(`meta[name="${name}"]`)
  if (!element) {
    element = document.createElement('meta')
    element.setAttribute('name', name)
    document.head.appendChild(element)
  }
  element.setAttribute('content', content)
}

export default function SEOManager() {
  const pathname = usePathname()
  const { language } = useLanguage()

  useEffect(() => {
    const updateSEO = async () => {
      let pageKey: PageKey | null = null
      if (pathname === '/') pageKey = 'home'
      else if (pathname.startsWith('/songs')) pageKey = 'songs'
      else if (pathname.startsWith('/gallery')) pageKey = 'gallery'
      else if (pathname.startsWith('/about')) pageKey = 'about'
      else if (pathname.startsWith('/contact')) pageKey = 'contact'
      if (!pageKey) return

      try {
        const seoSettings = await getSeoSettings()
        const pageSEO = { ...defaultSeoSettings[pageKey], ...(seoSettings[pageKey] ?? {}) }
        const title = language === 'ar' ? pageSEO.titleAr : pageSEO.titleEn
        const description = language === 'ar' ? pageSEO.descriptionAr : pageSEO.descriptionEn
        document.title = title
        setMeta('description', description)
        setMeta('keywords', pageSEO.keywords)
      } catch {
        const fallback = defaultSeoSettings[pageKey]
        document.title = language === 'ar' ? fallback.titleAr : fallback.titleEn
        setMeta('description', language === 'ar' ? fallback.descriptionAr : fallback.descriptionEn)
        setMeta('keywords', fallback.keywords)
      }
    }

    void updateSEO()
  }, [pathname, language])

  return null
}
