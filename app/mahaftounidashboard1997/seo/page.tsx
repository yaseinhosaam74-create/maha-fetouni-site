'use client'
import { useState, useEffect } from 'react'
import { getSeoSettings, saveSeoSettings, SeoSettings } from '@/lib/seo'
import toast from 'react-hot-toast'

export default function AdminSeoPage() {
  const [seoSettings, setSeoSettings] = useState<SeoSettings | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    const fetchSeoSettings = async () => {
      try {
        const settings = await getSeoSettings()
        setSeoSettings(settings)
      } catch (error) {
        toast.error('تعذر جلب إعدادات SEO')
      } finally {
        setLoading(false)
      }
    }
    fetchSeoSettings()
  }, [])

  const handleChange = (
    page: keyof SeoSettings,
    field: 'titleAr' | 'titleEn' | 'descriptionAr' | 'descriptionEn' | 'keywords',
    value: string
  ) => {
    if (!seoSettings) return
    setSeoSettings((prev) => {
      if (!prev) return prev
      return {
        ...prev,
        [page]: {
          ...prev[page],
          [field]: value,
        },
      }
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!seoSettings) return
    setSubmitting(true)
    try {
      await saveSeoSettings(seoSettings)
      toast.success('تم حفظ إعدادات SEO')
    } catch (error) {
      toast.error('تعذر الحفظ')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) return <div className="p-8 text-center">جارٍ التحميل...</div>
  if (!seoSettings) return <div className="p-8 text-center">تعذر تحميل الإعدادات</div>

  const pages: { key: keyof SeoSettings; label: string }[] = [
    { key: 'home', label: 'الرئيسية' },
    { key: 'songs', label: 'الأغاني' },
    { key: 'gallery', label: 'المعرض' },
    { key: 'about', label: 'نبذة' },
    { key: 'contact', label: 'اتصل بنا' },
  ]

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-8">إدارة SEO</h1>
      <form onSubmit={handleSubmit} className="space-y-8">
        {pages.map((page) => (
          <div key={page.key} className="bg-tamarind p-6 rounded-xl space-y-4">
            <h2 className="text-xl font-bold">{page.label}</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block mb-1">العنوان عربي</label>
                <input
                  type="text"
                  value={seoSettings[page.key].titleAr}
                  onChange={(e) => handleChange(page.key, 'titleAr', e.target.value)}
                  className="w-full p-3 rounded bg-italian-roast border border-boho focus:outline-none"
                />
              </div>
              <div>
                <label className="block mb-1">العنوان إنجليزي</label>
                <input
                  type="text"
                  value={seoSettings[page.key].titleEn}
                  onChange={(e) => handleChange(page.key, 'titleEn', e.target.value)}
                  className="w-full p-3 rounded bg-italian-roast border border-boho focus:outline-none"
                />
              </div>
              <div>
                <label className="block mb-1">الوصف عربي</label>
                <textarea
                  value={seoSettings[page.key].descriptionAr}
                  onChange={(e) => handleChange(page.key, 'descriptionAr', e.target.value)}
                  rows={3}
                  className="w-full p-3 rounded bg-italian-roast border border-boho focus:outline-none resize-none"
                />
              </div>
              <div>
                <label className="block mb-1">الوصف إنجليزي</label>
                <textarea
                  value={seoSettings[page.key].descriptionEn}
                  onChange={(e) => handleChange(page.key, 'descriptionEn', e.target.value)}
                  rows={3}
                  className="w-full p-3 rounded bg-italian-roast border border-boho focus:outline-none resize-none"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block mb-1">الكلمات المفتاحية</label>
                <input
                  type="text"
                  value={seoSettings[page.key].keywords}
                  onChange={(e) => handleChange(page.key, 'keywords', e.target.value)}
                  className="w-full p-3 rounded bg-italian-roast border border-boho focus:outline-none"
                  placeholder="كلمة1, كلمة2, ..."
                />
              </div>
            </div>
          </div>
        ))}
        <button
          type="submit"
          disabled={submitting}
          className="bg-rubine text-white px-6 py-3 rounded-full hover:bg-tamarind transition disabled:opacity-50"
        >
          {submitting ? 'جارٍ الحفظ...' : 'حفظ إعدادات SEO'}
        </button>
      </form>
    </div>
  )
}