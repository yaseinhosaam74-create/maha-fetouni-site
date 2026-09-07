'use client'
import { useState, useEffect } from 'react'
import { getSiteSettings } from '@/lib/firestore'
import ContactForm from '@/components/ContactForm'
import { useLanguage } from '@/app/context/LanguageContext'
import { FaFacebook, FaInstagram, FaTwitter, FaYoutube, FaTiktok, FaSnapchat, FaWhatsapp, FaSpotify, FaEnvelope } from 'react-icons/fa'

type SocialLink = {
  url: string
  enabled: boolean
  color: string
}

export default function ContactPage() {
  const [socialLinks, setSocialLinks] = useState<Record<string, SocialLink>>({})
  const [loading, setLoading] = useState(true)
  const { language, t } = useLanguage()

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
    return (
      <div className="min-h-screen flex items-center justify-center text-camel-coat">
        {t('sending') || 'جارٍ التحميل...'}
      </div>
    )
  }

  return (
    <div className="max-w-xl mx-auto p-4 md:p-8">
      <h1 className="text-3xl font-bold text-center text-camel-coat mb-8">
        {t('contact')}
      </h1>

      {/* نموذج الرسالة */}
      <div className="mb-10">
        <ContactForm />
      </div>

      {/* أيقونات التواصل الاجتماعي في سطر واحد */}
      <div className="text-center">
        <h2 className="text-lg font-semibold text-boho mb-4">
          {t('followUs') || 'تابعنا'}
        </h2>
        {visibleSocials.length === 0 ? (
          <p className="text-boho text-sm">{t('noSocialLinks') || 'لا توجد روابط بعد'}</p>
        ) : (
          <div className="flex flex-wrap justify-center gap-6">
            {visibleSocials.map((item) => {
              const Icon = item.icon
              const link = socialLinks[item.key]
              return (
                <div key={item.key} className="relative group">
                  <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 rounded bg-italian-roast text-camel-coat text-xs font-bold opacity-0 group-hover:opacity-100 transition pointer-events-none whitespace-nowrap">
                    {item.label}
                  </span>
                  <a
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-3xl transition hover:scale-110"
                    style={{ color: link.color }}
                  >
                    <Icon />
                  </a>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}