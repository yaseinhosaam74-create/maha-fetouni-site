'use client'
import { useState, useEffect } from 'react'
import { db } from '@/lib/firebase'
import { doc, getDoc, setDoc } from 'firebase/firestore'
import toast from 'react-hot-toast'

export default function AdminSettingsPage() {
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  // حقول عامة
  const [siteNameAr, setSiteNameAr] = useState('')
  const [siteNameEn, setSiteNameEn] = useState('')
  const [heroTitleAr, setHeroTitleAr] = useState('')
  const [heroTitleEn, setHeroTitleEn] = useState('')
  const [heroSubtitleAr, setHeroSubtitleAr] = useState('')
  const [heroSubtitleEn, setHeroSubtitleEn] = useState('')
  const [heroSubtitle2Ar, setHeroSubtitle2Ar] = useState('')
  const [heroSubtitle2En, setHeroSubtitle2En] = useState('')
  const [aboutTextAr, setAboutTextAr] = useState('')
  const [aboutTextEn, setAboutTextEn] = useState('')
  const [contactEmail, setContactEmail] = useState('')
  const [phoneNumber, setPhoneNumber] = useState('')
  const [copyrightAr, setCopyrightAr] = useState('')
  const [copyrightEn, setCopyrightEn] = useState('')

  // روابط السوشيال
  const [socialLinks, setSocialLinks] = useState<Record<string, { url: string; enabled: boolean; color: string }>>({
    facebook: { url: '', enabled: false, color: '#1877F2' },
    instagram: { url: '', enabled: false, color: '#E4405F' },
    twitter: { url: '', enabled: false, color: '#1DA1F2' },
    youtube: { url: '', enabled: false, color: '#FF0000' },
    tiktok: { url: '', enabled: false, color: '#000000' },
    snapchat: { url: '', enabled: false, color: '#FFFC00' },
    whatsapp: { url: '', enabled: false, color: '#25D366' },
    spotify: { url: '', enabled: false, color: '#1DB954' },
    email: { url: '', enabled: false, color: '#D44638' },
  })

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const docRef = doc(db, 'settings', 'site_settings')
        const docSnap = await getDoc(docRef)
        if (docSnap.exists()) {
          const data = docSnap.data()
          setSiteNameAr(data.siteNameAr || '')
          setSiteNameEn(data.siteNameEn || '')
          setHeroTitleAr(data.heroTitleAr || '')
          setHeroTitleEn(data.heroTitleEn || '')
          setHeroSubtitleAr(data.heroSubtitleAr || '')
          setHeroSubtitleEn(data.heroSubtitleEn || '')
          setHeroSubtitle2Ar(data.heroSubtitle2Ar || data.heroSubtitle2 || '')
          setHeroSubtitle2En(data.heroSubtitle2En || data.heroSubtitle2 || '')
          setAboutTextAr(data.aboutTextAr || '')
          setAboutTextEn(data.aboutTextEn || '')
          setContactEmail(data.contactEmail || '')
          setPhoneNumber(data.phoneNumber || '')
          setCopyrightAr(data.copyrightAr || '')
          setCopyrightEn(data.copyrightEn || '')
          if (data.socialLinks) {
            setSocialLinks((prev) => {
              const updated = { ...prev }
              Object.keys(updated).forEach((key) => {
                if (data.socialLinks[key]) {
                  updated[key] = {
                    url: data.socialLinks[key].url || '',
                    enabled: data.socialLinks[key].enabled ?? false,
                    color: data.socialLinks[key].color || updated[key].color,
                  }
                }
              })
              return updated
            })
          }
        }
      } catch (error) {
        toast.error('تعذر جلب الإعدادات')
      } finally {
        setLoading(false)
      }
    }
    fetchSettings()
  }, [])

  const handleSocialChange = (key: string, field: 'url' | 'enabled' | 'color', value: string | boolean) => {
    setSocialLinks((prev) => ({
      ...prev,
      [key]: {
        ...prev[key],
        [field]: value,
      },
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    try {
      await setDoc(doc(db, 'settings', 'site_settings'), {
        siteNameAr,
        siteNameEn,
        heroTitleAr,
        heroTitleEn,
        heroSubtitleAr,
        heroSubtitleEn,
        heroSubtitle2Ar,
        heroSubtitle2En,
        aboutTextAr,
        aboutTextEn,
        contactEmail,
        phoneNumber,
        copyrightAr,
        copyrightEn,
        socialLinks,
        updatedAt: new Date(),
      }, { merge: true })
      toast.success('تم حفظ الإعدادات')
    } catch (error) {
      toast.error('تعذر الحفظ')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) return <div className="p-8 text-center">جارٍ التحميل...</div>

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-8">إعدادات الموقع</h1>
      <form onSubmit={handleSubmit} className="bg-tamarind p-6 rounded-xl space-y-6">
        {/* بيانات عامة */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block mb-1">اسم الموقع عربي</label>
            <input type="text" value={siteNameAr} onChange={(e) => setSiteNameAr(e.target.value)} className="w-full p-3 rounded bg-italian-roast border border-boho focus:outline-none" />
          </div>
          <div>
            <label className="block mb-1">اسم الموقع إنجليزي</label>
            <input type="text" value={siteNameEn} onChange={(e) => setSiteNameEn(e.target.value)} className="w-full p-3 rounded bg-italian-roast border border-boho focus:outline-none" />
          </div>
          <div>
            <label className="block mb-1">العنوان الرئيسي عربي</label>
            <input type="text" value={heroTitleAr} onChange={(e) => setHeroTitleAr(e.target.value)} className="w-full p-3 rounded bg-italian-roast border border-boho focus:outline-none" />
          </div>
          <div>
            <label className="block mb-1">العنوان الرئيسي إنجليزي</label>
            <input type="text" value={heroTitleEn} onChange={(e) => setHeroTitleEn(e.target.value)} className="w-full p-3 rounded bg-italian-roast border border-boho focus:outline-none" />
          </div>
          <div>
            <label className="block mb-1">الفرعي عربي</label>
            <input type="text" value={heroSubtitleAr} onChange={(e) => setHeroSubtitleAr(e.target.value)} className="w-full p-3 rounded bg-italian-roast border border-boho focus:outline-none" />
          </div>
          <div>
            <label className="block mb-1">الفرعي إنجليزي</label>
            <input type="text" value={heroSubtitleEn} onChange={(e) => setHeroSubtitleEn(e.target.value)} className="w-full p-3 rounded bg-italian-roast border border-boho focus:outline-none" />
          </div>
          <div>
            <label className="block mb-1">الجملة الثانية (الصفحة الرئيسية) عربي</label>
            <input type="text" value={heroSubtitle2Ar} onChange={(e) => setHeroSubtitle2Ar(e.target.value)} className="w-full p-3 rounded bg-italian-roast border border-boho focus:outline-none" />
          </div>
          <div>
            <label className="block mb-1">الجملة الثانية (الصفحة الرئيسية) إنجليزي</label>
            <input type="text" value={heroSubtitle2En} onChange={(e) => setHeroSubtitle2En(e.target.value)} className="w-full p-3 rounded bg-italian-roast border border-boho focus:outline-none" />
          </div>
        </div>

        <div>
          <label className="block mb-1">نبذة عربي</label>
          <textarea value={aboutTextAr} onChange={(e) => setAboutTextAr(e.target.value)} rows={4} className="w-full p-3 rounded bg-italian-roast border border-boho focus:outline-none resize-none" />
        </div>
        <div>
          <label className="block mb-1">نبذة إنجليزي</label>
          <textarea value={aboutTextEn} onChange={(e) => setAboutTextEn(e.target.value)} rows={4} className="w-full p-3 rounded bg-italian-roast border border-boho focus:outline-none resize-none" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block mb-1">البريد الإلكتروني للتواصل</label>
            <input type="email" value={contactEmail} onChange={(e) => setContactEmail(e.target.value)} className="w-full p-3 rounded bg-italian-roast border border-boho focus:outline-none" />
          </div>
          <div>
            <label className="block mb-1">رقم الهاتف</label>
            <input type="text" value={phoneNumber} onChange={(e) => setPhoneNumber(e.target.value)} className="w-full p-3 rounded bg-italian-roast border border-boho focus:outline-none" />
          </div>
          <div>
            <label className="block mb-1">حقوق النشر عربي</label>
            <input type="text" value={copyrightAr} onChange={(e) => setCopyrightAr(e.target.value)} className="w-full p-3 rounded bg-italian-roast border border-boho focus:outline-none" placeholder="© 2024 مهى فتوني - جميع الحقوق محفوظة" />
          </div>
          <div>
            <label className="block mb-1">حقوق النشر إنجليزي</label>
            <input type="text" value={copyrightEn} onChange={(e) => setCopyrightEn(e.target.value)} className="w-full p-3 rounded bg-italian-roast border border-boho focus:outline-none" placeholder="© 2024 Maha Ftouni - All rights reserved" />
          </div>
        </div>

        {/* روابط السوشيال */}
        <div>
          <h2 className="text-xl font-bold mb-4">روابط التواصل الاجتماعي</h2>
          <div className="space-y-4">
            {Object.entries(socialLinks).map(([key, value]) => (
              <div key={key} className="border border-boho rounded-lg p-3 bg-italian-roast">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-bold capitalize">{key}</span>
                  <button
                    type="button"
                    onClick={() => handleSocialChange(key, 'enabled', !value.enabled)}
                    className={`px-3 py-1 rounded-full text-xs font-bold ${value.enabled ? 'bg-green-500 text-white' : 'bg-gray-500 text-white'}`}
                  >
                    {value.enabled ? 'مفعل' : 'معطل'}
                  </button>
                </div>
                {value.enabled && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    <input
                      type="url"
                      placeholder="الرابط"
                      value={value.url}
                      onChange={(e) => handleSocialChange(key, 'url', e.target.value)}
                      className="w-full p-2 rounded bg-italian-roast border border-boho focus:outline-none"
                    />
                    <input
                      type="color"
                      value={value.color}
                      onChange={(e) => handleSocialChange(key, 'color', e.target.value)}
                      className="w-full h-10 rounded bg-italian-roast border border-boho cursor-pointer"
                    />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        <button type="submit" disabled={submitting} className="bg-rubine text-white px-6 py-3 rounded-full hover:bg-tamarind transition disabled:opacity-50">
          {submitting ? 'جارٍ الحفظ...' : 'حفظ الإعدادات'}
        </button>
      </form>
    </div>
  )
}