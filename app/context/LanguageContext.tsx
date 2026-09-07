'use client'
import React, { createContext, useContext, useState, useEffect } from 'react'

type Language = 'ar' | 'en'

type LanguageContextType = {
  language: Language
  setLanguage: (lang: Language) => void
  t: (key: string) => string
  isReady: boolean
}

const translations: Record<string, Record<string, string>> = {
  siteName: { ar: 'مهى فتوني', en: 'Maha Ftouni' },
  heroSubtitle: { ar: 'المطربة اللبنانية', en: 'Lebanese Singer' },
  heroSubtitle2: { ar: 'استمع واستمتع', en: 'Listen and Enjoy' },
  home: { ar: 'الرئيسية', en: 'Home' },
  songs: { ar: 'الأغاني', en: 'Songs' },
  gallery: { ar: 'المعرض', en: 'Gallery' },
  about: { ar: 'نبذة', en: 'About' },
  contact: { ar: 'اتصل بنا', en: 'Contact' },
  latestSongs: { ar: 'أحدث الأغاني', en: 'Latest Songs' },
  latestAlbums: { ar: 'أحدث الألبومات', en: 'Latest Albums' },
  viewAll: { ar: 'عرض الكل', en: 'View All' },
  noSongs: { ar: 'لا توجد أغانٍ بعد', en: 'No songs yet' },
  noAlbums: { ar: 'لا توجد ألبومات بعد', en: 'No albums yet' },
  play: { ar: 'تشغيل', en: 'Play' },
  pause: { ar: 'إيقاف مؤقت', en: 'Pause' },
  download: { ar: 'تحميل', en: 'Download' },
  share: { ar: 'مشاركة', en: 'Share' },
  like: { ar: 'إعجاب', en: 'Like' },
  lyrics: { ar: 'كلمات الأغنية', en: 'Lyrics' },
  composer: { ar: 'الملحن', en: 'Composer' },
  lyricist: { ar: 'كاتب الكلمات', en: 'Lyricist' },
  arranger: { ar: 'الموزع', en: 'Arranger' },
  album: { ar: 'الألبوم', en: 'Album' },
  year: { ar: 'السنة', en: 'Year' },
  notFound: { ar: 'الصفحة غير موجودة', en: 'Page Not Found' },
  backHome: { ar: 'العودة للرئيسية', en: 'Back Home' },
  followUs: { ar: 'تابعنا', en: 'Follow Us' },
  sendMessage: { ar: 'أرسل رسالة', en: 'Send a Message' },
  messageSent: { ar: 'تم إرسال رسالتك بنجاح', en: 'Message sent successfully' },
  sending: { ar: 'جارٍ الإرسال...', en: 'Sending...' },
  send: { ar: 'إرسال', en: 'Send' },
  name: { ar: 'الاسم', en: 'Name' },
  email: { ar: 'البريد الإلكتروني', en: 'Email' },
  subject: { ar: 'الموضوع', en: 'Subject' },
  message: { ar: 'الرسالة', en: 'Message' },
  contactViaEmail: { ar: 'يمكنكم التواصل عبر البريد الإلكتروني:', en: 'You can reach us via email:' },
  shareApp: { ar: 'شارك الموقع', en: 'Share App' },
  downloadContact: { ar: 'تحميل جهة الاتصال', en: 'Download Contact' },
  qrScan: { ar: 'امسح الكود لمشاركة الموقع', en: 'Scan to share the website' },
  close: { ar: 'إغلاق', en: 'Close' },
  changeLanguage: { ar: 'تغيير اللغة', en: 'Change Language' },
  toggleTheme: { ar: 'تبديل الوضع', en: 'Toggle Theme' },
  dontForget: { ar: 'لا تنسي مهى فتوني', en: "Don't Forget Maha Ftouni" },
  followUsOn: { ar: 'تابعونا على', en: 'Follow us on' },
  allRights: { ar: 'جميع الحقوق محفوظة', en: 'All rights reserved' },
  noSocialLinks: { ar: 'لا توجد روابط بعد', en: 'No links yet' },
  selectSong: { ar: 'اختر أغنية لبدء التشغيل', en: 'Select a song to start playing' },
  copiedLink: { ar: 'تم نسخ الرابط', en: 'Link copied' },
  shareSong: { ar: 'شارك الأغنية', en: 'Share Song' },
  copyright: { ar: '© 2024 مهى فتوني - جميع الحقوق محفوظة', en: '© 2024 Maha Ftouni - All rights reserved' },
}

const LanguageContext = createContext<LanguageContextType | null>(null)

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguage] = useState<Language>('ar')
  const [isReady, setIsReady] = useState(false)

  useEffect(() => {
    const stored = localStorage.getItem('language')
    if (stored === 'ar' || stored === 'en') {
      setLanguage(stored)
    }
    setIsReady(true)
  }, [])

  useEffect(() => {
    document.documentElement.lang = language
    document.documentElement.dir = language === 'ar' ? 'rtl' : 'ltr'
  }, [language])

  const changeLanguage = (lang: Language) => {
    setLanguage(lang)
    localStorage.setItem('language', lang)
  }

  const t = (key: string): string => {
    return translations[key]?.[language] || key
  }

  return (
    <LanguageContext.Provider value={{ language, setLanguage: changeLanguage, t, isReady }}>
      {children}
    </LanguageContext.Provider>
  )
}

export const useLanguage = () => {
  const context = useContext(LanguageContext)
  if (!context) throw new Error('useLanguage must be used within LanguageProvider')
  return context
}