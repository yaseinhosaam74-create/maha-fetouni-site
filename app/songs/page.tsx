'use client'
import { useState, useEffect, useRef } from 'react'
import { collection, query, where, getDocs } from 'firebase/firestore'
import { useRouter } from 'next/navigation'
import { db } from '@/lib/firebase'
import SongCard from '@/components/SongCard'
import { useLanguage } from '@/app/context/LanguageContext'
import { useAudio, Song } from '@/components/AudioContext' // 👈 استيراد useAudio ونوع Song

export default function SongsPage() {
  const [songs, setSongs] = useState<Song[]>([])
  const [loading, setLoading] = useState(true)
  const { t } = useLanguage()
  const router = useRouter()
  
  const { playSongFromPlaylist } = useAudio() // 👈 جلب دالة التشغيل
  const clickTimeout = useRef<NodeJS.Timeout | null>(null) // 👈 للتحكم في الفرق بين الضغطة والضغطتين

  useEffect(() => {
    const fetchSongs = async () => {
      try {
        const q = query(collection(db, 'songs'), where('isPublished', '==', true))
        const snapshot = await getDocs(q)
        const songsList = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as Song))
        setSongs(songsList)
      } catch (error) {
        console.error('Error fetching songs:', error)
      } finally {
        setLoading(false)
      }
    }
    fetchSongs()
  }, [])

  // دالة الضغط العادي (تفتح صفحة الأغنية بعد تأخير بسيط)
  const handleCardClick = (e: React.MouseEvent, songId: string) => {
    e.preventDefault()
    
    // لو فيه ضغطة سابقة، بنلغيها (عشان دي بقت ضغطة مزدوجة)
    if (clickTimeout.current) {
      clearTimeout(clickTimeout.current)
      clickTimeout.current = null
    } else {
      // لو مفيش، بنستنى 300 ملي ثانية وننفذ الفتح
      clickTimeout.current = setTimeout(() => {
        router.push(`/songs/${songId}`)
        clickTimeout.current = null
      }, 300)
    }
  }

  // دالة الضغط المزدوج (تشغل الأغنية فوراً)
  const handleCardDoubleClick = (e: React.MouseEvent, song: Song) => {
    e.preventDefault()
    
    // إلغاء التوقيت بتاع الضغطة الواحدة عشان ميفتحش الصفحة
    if (clickTimeout.current) {
      clearTimeout(clickTimeout.current)
      clickTimeout.current = null
    }
    
    // تشغيل الأغنية وتمرير قائمة الأغاني كاملة للمشغل
    playSongFromPlaylist(songs, song)
  }

  if (loading) {
    return <div className="p-8 text-center text-camel-coat">جارٍ التحميل...</div>
  }

  return (
    <div className="max-w-7xl mx-auto p-8">
      <h1 className="text-3xl font-bold text-camel-coat mb-8">{t('songs')}</h1>
      {songs.length === 0 ? (
        <p className="text-boho text-center py-12">{t('noSongs')}</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {songs.map((song) => (
            <div 
              key={song.id} 
              onClick={(e) => handleCardClick(e, song.id)} 
              onDoubleClick={(e) => handleCardDoubleClick(e, song)}
              className="cursor-pointer select-none"
            >
              <SongCard song={song} />
            </div>
          ))}
        </div>
      )}
    </div>
  )
}