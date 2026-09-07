'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, Music, Camera, Info, Mail, Languages, Sun, Moon, QrCode, UserPlus, Share2 } from 'lucide-react'
import { useLanguage } from '@/app/context/LanguageContext'
import { useTheme } from '@/components/ThemeContext'
import { useState, useEffect } from 'react'
import toast from 'react-hot-toast'
import QRModal from './QRModal'
import { db } from '@/lib/firebase'
import { doc, getDoc } from 'firebase/firestore'

export default function Header() {
  const pathname = usePathname()
  const { language, setLanguage, t } = useLanguage()
  const { theme, toggleTheme } = useTheme()
  const [showQr, setShowQr] = useState(false)
  const [phoneNumber, setPhoneNumber] = useState('')
  const [siteName, setSiteName] = useState('')
  const isActive = (path: string) => pathname === path

  useEffect(() => {
    const fetchData = async () => {
      try {
        const docRef = doc(db, 'settings', 'site_settings')
        const docSnap = await getDoc(docRef)
        if (docSnap.exists()) {
          const data = docSnap.data()
          setPhoneNumber(data.phoneNumber || '')
          setSiteName(language === 'ar' ? data.siteNameAr || 'مهى فتوني' : data.siteNameEn || 'Maha Ftouni')
        }
      } catch (error) {
        console.error('Error fetching header data:', error)
      }
    }
    fetchData()
  }, [language])

  const navItems = [
    { href: '/', label: t('home'), icon: Home },
    { href: '/songs', label: t('songs'), icon: Music },
    { href: '/gallery', label: t('gallery'), icon: Camera },
    { href: '/about', label: t('about'), icon: Info },
    { href: '/contact', label: t('contact'), icon: Mail },
  ]

  const handleShareApp = async () => {
    const shareData = {
      title: siteName,
      text: 'استمع إلى أغاني مهى فتوني',
      url: window.location.origin,
    }
    if (navigator.share) {
      try {
        await navigator.share(shareData)
      } catch (error) {
        toast.error('تعذرت المشاركة')
      }
    } else {
      navigator.clipboard.writeText(window.location.origin)
      toast.success('تم نسخ رابط الموقع')
    }
  }

  const handleSaveContact = () => {
    const phone = phoneNumber || '+9610000000'
    const vcard = `BEGIN:VCARD\nVERSION:3.0\nFN:${siteName}\nTEL:${phone}\nEND:VCARD`
    const blob = new Blob([vcard], { type: 'text/vcard;charset=utf-8' })
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = 'contact.vcf'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    window.URL.revokeObjectURL(url)
  }

  return (
    <header className="bg-italian-roast/80 backdrop-blur-md sticky top-0 z-50" suppressHydrationWarning>
      <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between flex-wrap gap-2">
        <Link href="/" className="text-2xl font-bold text-camel-coat" suppressHydrationWarning>
          {siteName || t('siteName')}
        </Link>

        <nav className="flex gap-2 md:gap-4 flex-wrap">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-1 px-3 py-2 rounded-full transition ${
                isActive(item.href)
                  ? 'bg-rubine text-white'
                  : 'text-camel-coat hover:bg-tamarind'
              }`}
            >
              <item.icon size={18} />
              <span className="hidden sm:inline" suppressHydrationWarning>{item.label}</span>
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <button onClick={() => setLanguage(language === 'ar' ? 'en' : 'ar')} className="p-2 rounded-full hover:bg-tamarind transition text-camel-coat" title="تغيير اللغة">
            <Languages size={20} />
          </button>
          <button onClick={toggleTheme} className="p-2 rounded-full hover:bg-tamarind transition text-camel-coat" title="تبديل الوضع">
            {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
          </button>
          <button onClick={() => setShowQr(true)} className="p-2 rounded-full hover:bg-tamarind transition text-camel-coat" title="رمز QR">
            <QrCode size={20} />
          </button>
          <button onClick={handleSaveContact} className="p-2 rounded-full hover:bg-tamarind transition text-camel-coat" title="تحميل جهة الاتصال">
            <UserPlus size={20} />
          </button>
          <button onClick={handleShareApp} className="p-2 rounded-full hover:bg-tamarind transition text-camel-coat" title="مشاركة الموقع">
            <Share2 size={20} />
          </button>
        </div>
      </div>

      <QRModal isOpen={showQr} onClose={() => setShowQr(false)} />
    </header>
  )
}