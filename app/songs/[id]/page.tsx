'use client'
import FullScreenLyrics from '@/components/FullScreenLyrics'
import { useState, useEffect, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { doc, getDoc } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { useLanguage } from '@/app/context/LanguageContext'
import { useAudio } from '@/components/AudioContext'
import { Play, Pause, Share2, Download, Heart, ArrowRight, Music, Volume2, VolumeX, SkipBack, SkipForward, Image as ImageIcon, Loader2 } from 'lucide-react'
import toast from 'react-hot-toast'
import { likeSong, unlikeSong, isSongLiked } from '@/lib/firestore'
import { toPng } from 'html-to-image'

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
  syncedLyricsAr?: string
  syncedLyricsEn?: string
  isPublished: boolean
  plays: number
  likes: number
}

export default function SongDetailPage() {
  const params = useParams()
  const songId = params.id as string
  const router = useRouter()
  const { language } = useLanguage()
  
  const { currentSong, isPlaying, isMuted, togglePlay, toggleMute, playSong, next, prev, playlist, currentTime, duration, seek } = useAudio()
  
  const [song, setSong] = useState<SongData | null>(null)
  const [loading, setLoading] = useState(true)
  const [liked, setLiked] = useState(false)
  const [deviceId, setDeviceId] = useState('')
  const [isLyricsOpen, setIsLyricsOpen] = useState(false)
  
  const [isGeneratingImg, setIsGeneratingImg] = useState(false)
  const shareCardRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    let stored = localStorage.getItem('deviceId')
    if (!stored) {
      stored = 'dev_' + Math.random().toString(36).substring(2, 15) + Date.now().toString(36)
      localStorage.setItem('deviceId', stored)
    }
    setDeviceId(stored)
  }, [])

  useEffect(() => {
    const fetchSong = async () => {
      setLoading(true)
      try {
        const docSnap = await getDoc(doc(db, 'songs', songId))
        if (docSnap.exists() && docSnap.data().isPublished) {
          const songData = { id: docSnap.id, ...docSnap.data() } as SongData
          setSong(songData)
          isSongLiked(songId, deviceId).then(setLiked)
        } else {
          setSong(null)
        }
      } catch (error) {
        console.error('Error fetching song:', error)
        setSong(null)
      } finally {
        setLoading(false)
      }
    }
    fetchSong()
  }, [songId, deviceId])

  if (loading) return <div className="min-h-screen flex items-center justify-center text-camel-coat">جارٍ التحميل...</div>
  if (!song) return <div className="min-h-screen flex flex-col items-center justify-center p-8 text-center"><h1 className="text-3xl font-bold text-camel-coat mb-4">الأغنية غير موجودة</h1><button onClick={() => router.push('/')} className="bg-rubine text-white px-6 py-3 rounded-full">العودة للرئيسية</button></div>

  const title = language === 'ar' ? song.titleAr || song.titleEn : song.titleEn || song.titleAr
  const artist = language === 'ar' ? song.artistAr || 'مهى فتوني' : song.artistEn || 'Maha Ftouni'
  const lyrics = language === 'ar' ? song.lyricsAr : song.lyricsEn
  const isCurrent = currentSong?.id === song.id
  const syncedLyrics = language === 'ar' ? song.syncedLyricsAr : song.syncedLyricsEn

  const handleShare = async () => {
    const songUrl = `${window.location.origin}/songs/${song.id}`
    const shareData = { title, text: `استمع إلى ${title} - ${artist}`, url: songUrl }
    if (navigator.share) {
      try { await navigator.share(shareData) } catch (error) { toast.error('تعذرت المشاركة') }
    } else {
      navigator.clipboard.writeText(songUrl)
      toast.success('تم نسخ رابط الأغنية')
    }
  }

  const handleShareImage = async () => {
    if (!shareCardRef.current) return
    setIsGeneratingImg(true)
    try {
      const dataUrl = await toPng(shareCardRef.current, { quality: 1, pixelRatio: 2, cacheBust: true })
      if (navigator.share) {
        const blob = await (await fetch(dataUrl)).blob()
        const file = new File([blob], 'song.png', { type: 'image/png' })
        await navigator.share({ files: [file], title: title, text: `استمع إلى ${title} من موقع مهى فتوني` })
      } else {
        const link = document.createElement('a')
        link.download = `${title}.png`
        link.href = dataUrl
        link.click()
        toast.success('تم تحميل الصورة')
      }
    } catch (error) { toast.error('تعذر إنشاء الصورة') } finally { setIsGeneratingImg(false) }
  }

  const handleDownload = async () => {
    try {
      const response = await fetch(song.audioUrl)
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `${title}.mp3`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)
    } catch (error) { toast.error('تعذر التحميل') }
  }

  const handleLike = async () => {
    if (!deviceId) return
    try {
      if (liked) { await unlikeSong(song.id, deviceId); setLiked(false) } 
      else { await likeSong(song.id, deviceId); setLiked(true) }
    } catch (error) { toast.error('تعذر تحديث الإعجاب') }
  }

  const handlePlayPause = () => { isCurrent ? togglePlay() : playSong(song) }

  const handleNext = () => {
    if (playlist.length === 0) return
    const currentIndex = playlist.findIndex((s) => s.id === song.id)
    if (currentIndex > -1 && currentIndex < playlist.length - 1) router.push(`/songs/${playlist[currentIndex + 1].id}`)
  }

  const handlePrev = () => {
    if (playlist.length === 0) return
    const currentIndex = playlist.findIndex((s) => s.id === song.id)
    if (currentIndex > 0) router.push(`/songs/${playlist[currentIndex - 1].id}`)
  }

  return (
    <div className="max-w-4xl mx-auto p-8 relative">
      <button onClick={() => router.push('/')} className="mb-8 flex items-center gap-2 text-boho hover:text-rubine transition">
        <ArrowRight size={20} /> {language === 'ar' ? 'العودة للمشغل الكبير' : 'Back to player'}
      </button>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="relative">
          <img src={song.coverImageUrl} alt={title} className="w-full aspect-square object-cover rounded-3xl shadow-2xl" />
          <button onClick={handlePlayPause} className="absolute bottom-4 left-4 bg-rubine text-white p-4 rounded-full shadow-lg hover:bg-tamarind transition">
            {isCurrent && isPlaying ? <Pause size={28} /> : <Play size={28} />}
          </button>
        </div>

        <div className="flex flex-col justify-center">
          <div className="flex items-center gap-2 mb-2">
            <Music size={20} className="text-rubine" />
            <span className="text-boho text-sm uppercase tracking-widest">{language === 'ar' ? song.albumAr : song.albumEn || 'أغنية'}</span>
          </div>
          <h1 className="text-4xl font-black text-camel-coat mb-2">{title}</h1>
          <p className="text-xl text-boho mb-4">{artist}</p>

          <div className="flex items-center gap-4 flex-wrap">
            <button onClick={handlePrev} className="p-2 rounded-full text-camel-coat hover:text-rubine transition"><SkipBack size={24} /></button>
            <button onClick={handlePlayPause} className="bg-rubine text-white px-6 py-3 rounded-full flex items-center gap-2 hover:bg-tamarind transition">
              {isCurrent && isPlaying ? <Pause size={20} /> : <Play size={20} />}
              {isCurrent && isPlaying ? 'إيقاف' : 'تشغيل'}
            </button>
            <button onClick={handleNext} className="p-2 rounded-full text-camel-coat hover:text-rubine transition"><SkipForward size={24} /></button>
            <button onClick={handleLike} className={`p-2 rounded-full ${liked ? 'text-rubine' : 'text-camel-coat'} hover:text-rubine transition`}><Heart size={24} fill={liked ? 'currentColor' : 'none'} /></button>
            <button onClick={handleDownload} className="p-2 rounded-full text-camel-coat hover:text-rubine transition"><Download size={24} /></button>
            <button onClick={handleShare} className="p-2 rounded-full text-camel-coat hover:text-rubine transition"><Share2 size={24} /></button>
            <button onClick={handleShareImage} disabled={isGeneratingImg} className="p-2 rounded-full text-camel-coat hover:text-rubine transition">
              {isGeneratingImg ? <Loader2 size={24} className="animate-spin" /> : <ImageIcon size={24} />}
            </button>
            <button onClick={toggleMute} className="p-2 rounded-full text-camel-coat hover:text-rubine transition">
              {isMuted ? <VolumeX size={24} /> : <Volume2 size={24} />}
            </button>
          </div>
        </div>
      </div>

      {lyrics && (
        <div onClick={() => setIsLyricsOpen(true)} className="mt-10 bg-tamarind rounded-3xl p-8 cursor-pointer hover:bg-opacity-80 transition-all border border-transparent hover:border-white/20 group">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold text-camel-coat">كلمات الأغنية</h2>
            <span className="text-sm text-boho group-hover:text-white transition">اضغط للعرض الكامل</span>
          </div>
          <p className="text-camel-coat whitespace-pre-line leading-loose text-center line-clamp-6">{lyrics}</p>
        </div>
      )}

      <div className="fixed top-0 left-0 -z-50 pointer-events-none opacity-0">
        <div ref={shareCardRef} className="w-[1080px] h-[1080px] relative flex flex-col items-center justify-center p-20 overflow-hidden bg-black text-center" dir={language === 'ar' ? 'rtl' : 'ltr'}>
          <img src={song.coverImageUrl} crossOrigin="anonymous" className="absolute inset-0 w-full h-full object-cover opacity-40 blur-3xl scale-110" />
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-black/20" />
          <div className="relative z-10 w-full flex flex-col items-center">
            <img src={song.coverImageUrl} crossOrigin="anonymous" className="w-72 h-72 rounded-2xl shadow-2xl mb-12 object-cover border-4 border-white/20" />
            <h2 className="text-white text-5xl font-black mb-4">{title}</h2>
            <p className="text-gray-300 text-2xl">{artist}</p>
            <div className="mt-20 pt-8 border-t border-white/20 w-2/3">
              <h3 className="text-white text-3xl font-black mb-2">{language === 'ar' ? 'مهى فتوني' : 'Maha Ftouni'}</h3>
              <p className="text-gray-400 text-lg">maha-ftouni.com</p>
            </div>
          </div>
        </div>
      </div>

      <FullScreenLyrics 
        isOpen={isLyricsOpen}
        onClose={() => setIsLyricsOpen(false)}
        lrcText={syncedLyrics}
        plainText={lyrics}
        currentTime={isCurrent ? currentTime : 0}
        duration={duration}
        title={title}
        artist={artist}
        onSeek={seek}
        coverImageUrl={song.coverImageUrl}
      />
    </div>
  )
}