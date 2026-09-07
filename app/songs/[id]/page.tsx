'use client'
import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { doc, getDoc } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { useLanguage } from '@/app/context/LanguageContext'
import { useAudio } from '@/components/AudioContext'
import { Play, Pause, Share2, Download, Heart, ArrowRight, Music, Volume2, VolumeX, SkipBack, SkipForward } from 'lucide-react'
import toast from 'react-hot-toast'
import { likeSong, unlikeSong, isSongLiked } from '@/lib/firestore'

type SongData = {
  id: string
  titleAr: string
  titleEn: string
  artistAr?: string
  artistEn?: string
  audioUrl: string
  coverImageUrl: string
  albumAr?: string
  albumEn?: string
  year?: number
  composerAr?: string
  composerEn?: string
  lyricistAr?: string
  lyricistEn?: string
  arrangerAr?: string
  arrangerEn?: string
  lyricsAr?: string
  lyricsEn?: string
  isPublished: boolean
  plays: number
  likes: number
}

export default function SongDetailPage() {
  const params = useParams()
  const songId = params.id as string
  const router = useRouter()
  const { language } = useLanguage()
  const { currentSong, isPlaying, isMuted, togglePlay, toggleMute, playSong, next, prev } = useAudio()
  const [displayedSong, setDisplayedSong] = useState<SongData | null>(null)
  const [loading, setLoading] = useState(true)
  const [liked, setLiked] = useState(false)
  const [deviceId, setDeviceId] = useState('')

  // جلب الأغنية من الرابط عند التحميل
  useEffect(() => {
    let stored = localStorage.getItem('deviceId')
    if (!stored) {
      stored = 'dev_' + Math.random().toString(36).substring(2, 15) + Date.now().toString(36)
      localStorage.setItem('deviceId', stored)
    }
    setDeviceId(stored)

    const fetchSong = async () => {
      try {
        const docSnap = await getDoc(doc(db, 'songs', songId))
        if (docSnap.exists() && docSnap.data().isPublished) {
          const songData = { id: docSnap.id, ...docSnap.data() } as SongData
          setDisplayedSong(songData)
          isSongLiked(songId, stored).then(setLiked)
        }
      } catch (error) {
        console.error('Error fetching song:', error)
      } finally {
        setLoading(false)
      }
    }
    fetchSong()
  }, [songId])

  // عندما يتغير currentSong (عبر أزرار التنقل) نحدّث displayedSong
  useEffect(() => {
    if (currentSong) {
      setDisplayedSong(currentSong)
      setLiked(false) // إعادة ضبط حالة الإعجاب مؤقتًا، وسيتم التحقق في effect التالي
      isSongLiked(currentSong.id, deviceId).then(setLiked)
    }
  }, [currentSong, deviceId])

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center text-camel-coat">جارٍ التحميل...</div>
  }

  if (!displayedSong) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-8 text-center">
        <h1 className="text-3xl font-bold text-camel-coat mb-4">الأغنية غير موجودة</h1>
        <button onClick={() => router.push('/')} className="bg-rubine text-white px-6 py-3 rounded-full">
          العودة للرئيسية
        </button>
      </div>
    )
  }

  const title = language === 'ar' ? displayedSong.titleAr || displayedSong.titleEn : displayedSong.titleEn || displayedSong.titleAr
  const artist = language === 'ar' ? displayedSong.artistAr || 'مهى فتوني' : displayedSong.artistEn || 'Maha Ftouni'
  const lyrics = language === 'ar' ? displayedSong.lyricsAr : displayedSong.lyricsEn
  const composer = language === 'ar' ? displayedSong.composerAr : displayedSong.composerEn
  const lyricist = language === 'ar' ? displayedSong.lyricistAr : displayedSong.lyricistEn
  const arranger = language === 'ar' ? displayedSong.arrangerAr : displayedSong.arrangerEn
  const album = language === 'ar' ? displayedSong.albumAr : displayedSong.albumEn
  const isCurrent = currentSong?.id === displayedSong.id

  const handleShare = async () => {
    const songUrl = window.location.origin + `/songs/${displayedSong.id}`
    const shareData = { title, text: `استمع إلى ${title} - ${artist}`, url: songUrl }
    if (navigator.share) {
      try {
        await navigator.share(shareData)
      } catch (error) {
        toast.error('تعذرت المشاركة')
      }
    } else {
      navigator.clipboard.writeText(songUrl)
      toast.success('تم نسخ رابط الأغنية')
    }
  }

  const handleDownload = async () => {
    try {
      const response = await fetch(displayedSong.audioUrl)
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `${title}.mp3`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)
    } catch (error) {
      toast.error('تعذر التحميل')
    }
  }

  const handleLike = async () => {
    if (!deviceId) return
    try {
      if (liked) {
        await unlikeSong(displayedSong.id, deviceId)
        setLiked(false)
      } else {
        await likeSong(displayedSong.id, deviceId)
        setLiked(true)
      }
    } catch (error) {
      toast.error('تعذر تحديث الإعجاب')
    }
  }

  const handlePlayPause = () => {
    if (isCurrent) {
      togglePlay()
    } else {
      playSong(displayedSong)
    }
  }

  const handleNext = () => {
    next()
  }

  const handlePrev = () => {
    prev()
  }

  const handleGoToPlayer = () => {
    router.push('/')
  }

  return (
    <div className="max-w-4xl mx-auto p-8">
      <button
        onClick={handleGoToPlayer}
        className="mb-8 flex items-center gap-2 text-boho hover:text-rubine transition"
      >
        <ArrowRight size={20} />
        {language === 'ar' ? 'العودة للمشغل الكبير' : 'Back to player'}
      </button>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="relative">
          <img
            src={displayedSong.coverImageUrl}
            alt={title}
            className="w-full aspect-square object-cover rounded-3xl shadow-2xl"
          />
          <button
            onClick={handlePlayPause}
            className="absolute bottom-4 left-4 bg-rubine text-white p-4 rounded-full shadow-lg hover:bg-tamarind transition"
          >
            {isCurrent && isPlaying ? <Pause size={28} /> : <Play size={28} />}
          </button>
        </div>

        <div className="flex flex-col justify-center">
          <div className="flex items-center gap-2 mb-2">
            <Music size={20} className="text-rubine" />
            <span className="text-boho text-sm uppercase tracking-widest">{album || 'أغنية'}</span>
          </div>
          <h1 className="text-4xl font-black text-camel-coat mb-2">{title}</h1>
          <p className="text-xl text-boho mb-4">{artist}</p>

          <div className="grid grid-cols-2 gap-4 text-sm mb-6">
            {composer && <div><span className="text-boho block">الملحن</span><span className="text-camel-coat">{composer}</span></div>}
            {lyricist && <div><span className="text-boho block">كاتب الكلمات</span><span className="text-camel-coat">{lyricist}</span></div>}
            {arranger && <div><span className="text-boho block">الموزع</span><span className="text-camel-coat">{arranger}</span></div>}
            {displayedSong.year && <div><span className="text-boho block">السنة</span><span className="text-camel-coat">{displayedSong.year}</span></div>}
          </div>

          <div className="flex items-center gap-4 flex-wrap">
            <button onClick={handlePrev} className="p-2 rounded-full text-camel-coat hover:text-rubine transition" title="السابق">
              <SkipBack size={24} />
            </button>
            <button onClick={handlePlayPause} className="bg-rubine text-white px-6 py-3 rounded-full flex items-center gap-2 hover:bg-tamarind transition">
              {isCurrent && isPlaying ? <Pause size={20} /> : <Play size={20} />}
              {isCurrent && isPlaying ? 'إيقاف' : 'تشغيل'}
            </button>
            <button onClick={handleNext} className="p-2 rounded-full text-camel-coat hover:text-rubine transition" title="التالي">
              <SkipForward size={24} />
            </button>
            <button onClick={handleLike} className={`p-2 rounded-full ${liked ? 'text-rubine' : 'text-camel-coat'} hover:text-rubine transition`}>
              <Heart size={24} fill={liked ? 'currentColor' : 'none'} />
            </button>
            <button onClick={handleDownload} className="p-2 rounded-full text-camel-coat hover:text-rubine transition">
              <Download size={24} />
            </button>
            <button onClick={handleShare} className="p-2 rounded-full text-camel-coat hover:text-rubine transition">
              <Share2 size={24} />
            </button>
            <button onClick={toggleMute} className="p-2 rounded-full text-camel-coat hover:text-rubine transition">
              {isMuted ? <VolumeX size={24} /> : <Volume2 size={24} />}
            </button>
          </div>
        </div>
      </div>

      {lyrics && (
        <div className="mt-10 bg-tamarind rounded-3xl p-8">
          <h2 className="text-2xl font-bold text-camel-coat mb-4">كلمات الأغنية</h2>
          <p className="text-camel-coat whitespace-pre-line leading-loose text-center">{lyrics}</p>
        </div>
      )}
    </div>
  )
}