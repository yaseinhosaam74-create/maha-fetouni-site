'use client'
import { useEffect } from 'react'
import { usePathname } from 'next/navigation'
import { getSeoSettings } from '@/lib/seo'
import { useLanguage } from '@/app/context/LanguageContext'

export default function SEOManager() {
  const pathname = usePathname()
  const { language } = useLanguage()

  useEffect(() => {
    const updateSEO = async () => {
      try {
        const seoSettings = await getSeoSettings()

        // تحديد الصفحة الحالية
        let pageKey: 'home' | 'songs' | 'gallery' | 'about' | 'contact' = 'home'
        if (pathname === '/') pageKey = 'home'
        else if (pathname.startsWith('/songs')) pageKey = 'songs'
        else if (pathname.startsWith('/gallery')) pageKey = 'gallery'
        else if (pathname.startsWith('/about')) pageKey = 'about'
        else if (pathname.startsWith('/contact')) pageKey = 'contact'
        else return // لا توجد إعدادات SEO لصفحات أخرى

        const pageSEO = seoSettings[pageKey]

        // تحديث عنوان التبويب
        document.title = language === 'ar' ? pageSEO.titleAr : pageSEO.titleEn

        // تحديث وسم الوصف
        let metaDescription = document.querySelector('meta[name="description"]')
        if (!metaDescription) {
          metaDescription = document.createElement('meta')
          metaDescription.setAttribute('name', 'description')
          document.head.appendChild(metaDescription)
        }
        metaDescription.setAttribute(
          'content',
          language === 'ar' ? pageSEO.descriptionAr : pageSEO.descriptionEn
        )

        // تحديث وسم الكلمات المفتاحية
        let metaKeywords = document.querySelector('meta[name="keywords"]')
        if (!metaKeywords) {
          metaKeywords = document.createElement('meta')
          metaKeywords.setAttribute('name', 'keywords')
          document.head.appendChild(metaKeywords)
        }
        metaKeywords.setAttribute('content', pageSEO.keywords)
      } catch (error) {
        console.error('Error updating SEO:', error)
      }
    }

    updateSEO()
  }, [pathname, language])

  return null
}