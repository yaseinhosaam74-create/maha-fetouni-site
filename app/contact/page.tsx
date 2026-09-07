'use client'
import { useState, useEffect } from 'react'
import { getSiteSettings } from '@/lib/firestore'
import ContactForm from '@/components/ContactForm'
import { useLanguage } from '@/app/context/LanguageContext'
import { FaFacebook, FaInstagram, FaTwitter, FaYoutube, FaTiktok, FaSnapchat, FaWhatsapp, FaSpotify, FaEnvelope } from 'react-icons/fa'

export default function ContactPage() {
  const [socialLinks, setSocialLinks] = useState<Record<string, { url: string; enabled: boolean; color: string }>>({})
  const [loading, setLoading] = useState(true)
  const { language } = useLanguage()

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const settings = await getSiteSettings()
        if (settings) {
          setSocialLinks(settings.socialLinks || {})
        }
      } catch (error) {
        console.error('Error fetching settings:', error)
      } finally {
        setLoading(false)
      }
    }
    fetchSettings()
  }, [])

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

  if (loading) {
    return <div className="p-8 text-center text-camel-coat">جارٍ التحميل...</div>
  }

  return (
    <div className="max-w-4xl mx-auto p-8">
      <h1 className="text-3xl font-bold text-camel-coat mb-8">
        {language === 'ar' ? 'اتصل بنا' : 'Contact Us'}
      </h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div>
          <h2 className="text-xl font-bold text-camel-coat mb-4">
            {language === 'ar' ? 'أرسل رسالة' : 'Send a Message'}
          </h2>
          <ContactForm />
        </div>

        <div>
          <h2 className="text-xl font-bold text-camel-coat mb-4">
            {language === 'ar' ? 'تابعنا' : 'Follow Us'}
          </h2>
          {visibleSocials.length === 0 ? (
            <p className="text-boho">لا توجد روابط بعد</p>
          ) : (
            <div className="grid grid-cols-3 gap-6">
              {visibleSocials.map((item) => {
                const Icon = item.icon
                const link = socialLinks[item.key]
                return (
                  <div key={item.key} className="flex flex-col items-center gap-2 group">
                    <a
                      href={link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-14 h-14 flex items-center justify-center rounded-full bg-tamarind border border-boho text-2xl transition hover:scale-110"
                      style={{ color: link.color }}
                    >
                      <Icon />
                    </a>
                    <span className="text-xs font-bold text-boho opacity-0 group-hover:opacity-100 transition">
                      {item.label}
                    </span>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}