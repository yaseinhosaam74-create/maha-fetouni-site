'use client'
import { useState, useEffect } from 'react'
import { getAnalyticsSummary } from '@/lib/analyticsStats'
import { BarChart3, Eye, Play, Heart, Image, Music, Mail, MessageSquare, TrendingUp } from 'lucide-react'

export default function AdminDashboardPage() {
  const [summary, setSummary] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchSummary = async () => {
      try {
        const data = await getAnalyticsSummary()
        setSummary(data)
      } catch (error) {
        console.error('Error fetching analytics summary:', error)
      } finally {
        setLoading(false)
      }
    }
    fetchSummary()
  }, [])

  if (loading) return <div className="p-8 text-center">جارٍ التحميل...</div>
  if (!summary) return <div className="p-8 text-center">تعذر تحميل الإحصائيات</div>

  const statCards = [
    { label: 'مشاهدات الصفحات', value: summary.totalPageViews, icon: Eye, color: 'bg-rubine' },
    { label: 'تشغيل الأغاني', value: summary.totalSongPlays, icon: Play, color: 'bg-boho' },
    { label: 'إعجابات الأغاني', value: summary.totalSongLikes, icon: Heart, color: 'bg-tamarind' },
    { label: 'الصور', value: summary.totalPhotos, icon: Image, color: 'bg-boho' },
    { label: 'الأغاني', value: summary.totalSongs, icon: Music, color: 'bg-rubine' },
    { label: 'الرسائل', value: summary.totalMessages, icon: Mail, color: 'bg-tamarind' },
    { label: 'رسائل غير مقروءة', value: summary.unreadMessages, icon: MessageSquare, color: 'bg-rubine' },
  ]

  const topPages = Object.entries(summary.pageViewsByPath || {}).sort((a: any, b: any) => b[1] - a[1]).slice(0, 5)
  const topPlayedSongs = Object.entries(summary.songPlaysById || {}).sort((a: any, b: any) => b[1] - a[1]).slice(0, 5)

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="flex items-center gap-3 mb-8">
        <BarChart3 size={32} />
        <h1 className="text-3xl font-bold">لوحة الإحصائيات</h1>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 mb-10">
        {statCards.map((card) => (
          <div key={card.label} className="bg-tamarind p-6 rounded-xl flex items-center gap-4">
            <div className={`p-3 rounded-full ${card.color} text-white`}>
              <card.icon size={24} />
            </div>
            <div>
              <p className="text-boho text-sm">{card.label}</p>
              <p className="text-2xl font-bold">{card.value}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="bg-tamarind p-6 rounded-xl">
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2"><TrendingUp size={20} /> الصفحات الأكثر زيارة</h2>
          {topPages.length === 0 ? <p className="text-boho">لا توجد بيانات</p> : (
            <ul className="space-y-2">
              {topPages.map(([path, count]: any) => (
                <li key={path} className="flex justify-between text-sm"><span>{path}</span><span className="font-bold">{count}</span></li>
              ))}
            </ul>
          )}
        </div>
        <div className="bg-tamarind p-6 rounded-xl">
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2"><Play size={20} /> الأغاني الأكثر تشغيلاً</h2>
          {topPlayedSongs.length === 0 ? <p className="text-boho">لا توجد بيانات</p> : (
            <ul className="space-y-2">
              {topPlayedSongs.map(([songId, count]: any) => (
                <li key={songId} className="flex justify-between text-sm"><span>{songId.substring(0, 20)}...</span><span className="font-bold">{count}</span></li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  )
}