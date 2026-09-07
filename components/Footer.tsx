'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { useLanguage } from '@/app/context/LanguageContext'
import { useAudio, Song } from '@/components/AudioContext'
import { FaFacebook, FaInstagram, FaTwitter, FaYoutube, FaTiktok, FaSnapchat, FaWhatsapp, FaSpotify, FaEnvelope } from 'react-icons/fa'

type SocialLink = {
  url: string
  enabled: boolean
  color: string
}

export default function Footer() {
  const { language, t } = useLanguage()
  const { playSongFromPlaylist } = useAudio()
  const router = useRouter()
  const [songs, setSongs] = useState<Song[]>([])
  const [socialLinks, setSocialLinks] = useState<Record<string, SocialLink>>({})
  const [siteName, setSiteName] = useState('')
  const [copyrightText, setCopyrightText] = useState('')

  useEffect(() => {
    const fetchSongs = async () => {
      try {
        const q = query(collection(db, 'songs'), where('isPublished', '==', true))
        const snapshot = await getDocs(q)
        const songsList = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as Song))
        setSongs(songsList)
      } catch (error) {
        console.error('Error fetching songs for footer:', error)
      }
    }
    fetchSongs()

    const fetchSettings = async () => {
      try {
        const docRef = doc(db, 'settings', 'site_settings')
        const docSnap = await getDoc(docRef)
        if (docSnap.exists()) {
          const data = docSnap.data()
          setSocialLinks(data.socialLinks || {})
          setSiteName(language === 'ar' ? data.siteNameAr || 'مهى فتوني' : data.siteNameEn || 'Maha Ftouni')
          setCopyrightText(language === 'ar' ? data.copyrightAr || '© 2024 مهى فتوني - جميع الحقوق محفوظة' : data.copyrightEn || '© 2024 Maha Ftouni - All rights reserved')
        }
      } catch (error) {
        console.error('Error fetching social links:', error)
      }
    }
    fetchSettings()
  }, [language])

  const handlePlaySong = (song: Song) => {
    playSongFromPlaylist(songs, song)
    router.push('/')
  }

  const socialItems = [
    { key: 'facebook', icon: FaFacebook, label: 'Facebook' },
    { key: 'instagram', icon: FaInstagram, label: 'Instagram' },
    { key: 'twitter', icon: FaTwitter, label: 'Twitter' },
    { key: 'youtube', icon: FaYoutube, label: 'YouTube' },
    { key: 'tiktok', icon: FaTiktok, label: 'TikTok' },
    { key: 'snapchat', icon: FaSnapchat, label: 'Snapchat' },
    { key: 'whatsapp', icon: FaWhatsapp, label: 'WhatsApp' },
    { key: 'spotify', icon: FaSpotify, label: 'Spotify' },
    { key: 'email', icon: FaEnvelope, label: 'Email' },
  ]

  const visibleSocials = socialItems.filter((item) => {
    const link = socialLinks[item.key]
    return link && link.enabled && link.url && link.url.trim() !== ''
  })

  return (
    <footer className="mt-16 bg-[#f5f0e8] border-t border-gray-300">
      <div className="max-w-7xl mx-auto px-4 py-10">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <h3 className="text-gray-900 font-bold mb-4">{siteName || t('siteName')}</h3>
            <ul className="space-y-2">
              <li><Link href="/" className="text-gray-700 hover:text-rubine transition">{t('home')}</Link></li>
              <li><Link href="/songs" className="text-gray-700 hover:text-rubine transition">{t('songs')}</Link></li>
              <li><Link href="/gallery" className="text-gray-700 hover:text-rubine transition">{t('gallery')}</Link></li>
              <li><Link href="/about" className="text-gray-700 hover:text-rubine transition">{t('about')}</Link></li>
              <li><Link href="/contact" className="text-gray-700 hover:text-rubine transition">{t('contact')}</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="text-gray-900 font-bold mb-4">{language === 'ar' ? 'الأغاني' : 'Songs'}</h3>
            {songs.length === 0 ? (
              <p className="text-gray-600 text-sm">لا توجد أغانٍ بعد</p>
            ) : (
              <ul className="space-y-1 max-h-40 overflow-y-auto custom-scroll">
                {songs.map((song) => (
                  <li key={song.id}>
                    <button onClick={() => handlePlaySong(song)} className="text-gray-700 hover:text-rubine transition text-sm">
                      {language === 'ar' ? song.titleAr || song.titleEn : song.titleEn || song.titleAr}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div>
            <h3 className="text-gray-900 font-bold mb-4">{language === 'ar' ? 'تابعنا' : 'Follow Us'}</h3>
            {visibleSocials.length === 0 ? (
              <p className="text-gray-600 text-sm">لا توجد روابط بعد</p>
            ) : (
              <div className="flex flex-wrap gap-4">
                {visibleSocials.map((item) => {
                  const Icon = item.icon
                  const link = socialLinks[item.key]
                  return (
                    <div key={item.key} className="relative group">
                      <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 rounded bg-gray-900 text-white text-xs font-bold opacity-0 group-hover:opacity-100 transition pointer-events-none whitespace-nowrap">
                        {item.label}
                      </span>
                      <a href={link.url} target="_blank" rel="noopener noreferrer" className="text-2xl transition hover:scale-110" style={{ color: link.color }}>
                        <Icon />
                      </a>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>

        <div className="text-center mt-10 border-t border-gray-300 pt-6">
          <p className="text-gray-600 text-sm" suppressHydrationWarning>{copyrightText || t('copyright')}</p>
        </div>
      </div>
    </footer>
  )
}