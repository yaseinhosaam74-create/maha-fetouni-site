'use client'
import Image from 'next/image'
import { useState, useEffect, useMemo } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { doc, getDoc } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { useLanguage } from '@/app/context/LanguageContext'
import { useAudio } from '@/components/AudioContext'
import { useDeviceId } from '@/lib/useLocalStorage'
import {
  Play, Pause, Download, Heart, ArrowRight, Music, Volume2, VolumeX,
  SkipBack, SkipForward, Image as ImageIcon, Shuffle, Repeat, Repeat1, Maximize2,
} from 'lucide-react'
import toast from 'react-hot-toast'
import { likeSong, unlikeSong, isSongLiked } from '@/lib/firestore'
import { getVisibleLyrics } from '@/lib/lyrics'
import { useSongLyrics } from '@/lib/useSongLyrics'
import SongShareButton from '@/components/SongShareButton'

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

type PreviewLine = { content: string; index: number; time: number; isActive: boolean }

export default function SongDetailPage() {
  const params = useParams()
  const songId = params.id as string
  const router = useRouter()
  const { language, t } = useLanguage()

  const {
    currentSong, isPlaying, isMuted, togglePlay, toggleMute, playSong, playlist,
    currentTime, duration, isShuffled, repeatMode, toggleShuffle, cycleRepeat,
    openFullscreenPlayer,
  } = useAudio()
  const deviceId = useDeviceId()

  const [song, setSong] = useState<SongData | null>(null)
  const [loading, setLoading] = useState(true)
  const [liked, setLiked] = useState(false)
  const [showMore, setShowMore] = useState(false)

  const { lyrics, plainText } = useSongLyrics(song, language, duration)
  const hasSynced = lyrics.isSynced
  const isCurrent = currentSong?.id === song?.id

  const previewLines = useMemo<PreviewLine[]>(() => {
    if (showMore && hasSynced) {
      return getVisibleLyrics(lyrics, isCurrent ? currentTime : 0, 8)
    }
    const source = plainText || lyrics.lines.map((line) => line.content).join('\n')
    const all = source
      .split(/\r\n|[\n\r]/)
      .map((line) => line.trim())
      .filter((line) => line.length > 0)
    const slice = showMore ? all : all.slice(0, 4)
    return slice.map((content, index) => ({ content, index, time: 0, isActive: false }))
  }, [showMore, hasSynced, lyrics, plainText, isCurrent, currentTime])

  const handleShowMore = () => {
    if (showMore) {
      setShowMore(false)
      return
    }
    setShowMore(true)
  }

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
  const smallButton = 'w-10 h-10 shrink-0 rounded-full flex items-center justify-center text-camel-coat hover:text-rubine hover:bg-rubine/10 transition'
  const smallActiveButton = 'w-10 h-10 shrink-0 rounded-full flex items-center justify-center text-rubine bg-rubine/15 transition'

  const openLyrics = () => {
    openFullscreenPlayer(song)
  }

  // Share button in small lyrics preview removed in Step 3.

  const handleDownloadCover = async () => {
    try {
      const response = await fetch(song.coverImageUrl)
      if (!response.ok) throw new Error(String(response.status))
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `${title}-cover.jpg`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)
      toast.success(t('coverDownloaded'))
    } catch {
      toast.error(t('shareFailed'))
    }
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
    } catch { toast.error('تعذر التحميل') }
  }

  const handleLike = async () => {
    if (!deviceId) return
    try {
      if (liked) { await unlikeSong(song.id, deviceId); setLiked(false) } 
      else { await likeSong(song.id, deviceId); setLiked(true) }
    } catch { toast.error('تعذر تحديث الإعجاب') }
  }

  const handlePlayPause = () => {
    if (isCurrent) togglePlay()
    else playSong(song)
  }

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
        <div className="relative aspect-square rounded-3xl shadow-2xl">
          <Image
            src={song.coverImageUrl}
            alt={title}
            fill
            priority
            sizes="(max-width: 768px) 100vw, 50vw"
            className="object-cover rounded-3xl"
          />
        </div>

        <div className="flex flex-col justify-center">
          <div className="flex items-center gap-2 mb-2">
            <Music size={20} className="text-rubine" />
            <span className="text-boho text-sm uppercase tracking-widest">{(language === 'ar' ? song.albumAr : song.albumEn) || t('album')}</span>
          </div>
          <h1 className="text-4xl font-black text-camel-coat mb-2">{title}</h1>
          <p className="text-xl text-boho mb-4">{artist}</p>

          <div className="mt-2 flex flex-col gap-3">
            <div className="flex justify-center items-center gap-8 h-16 shrink-0">
              <button onClick={handlePrev} className="w-12 h-12 rounded-full flex items-center justify-center text-camel-coat hover:text-rubine hover:bg-rubine/10 transition"><SkipBack size={24} /></button>
              <button onClick={handlePlayPause} className="bg-rubine text-white w-16 h-16 rounded-full flex items-center justify-center hover:bg-tamarind transition shrink-0" title={isCurrent && isPlaying ? t('pause') : t('play')}>
                {isCurrent && isPlaying ? <Pause size={28} /> : <Play size={28} />}
              </button>
              <button onClick={handleNext} className="w-12 h-12 rounded-full flex items-center justify-center text-camel-coat hover:text-rubine hover:bg-rubine/10 transition"><SkipForward size={24} /></button>
            </div>

            <div className="flex justify-center items-center gap-4 h-10 shrink-0">
              <button onClick={toggleShuffle} className={isShuffled ? smallActiveButton : smallButton} title={t('shuffle')} aria-pressed={isShuffled}><Shuffle size={19} /></button>
              <button
                onClick={cycleRepeat}
                className={repeatMode !== 'off' ? smallActiveButton : smallButton}
                title={repeatMode === 'off' ? t('repeatOff') : repeatMode === 'all' ? t('repeatAll') : t('repeatOne')}
                aria-label={repeatMode === 'off' ? t('repeatOff') : repeatMode === 'all' ? t('repeatAll') : t('repeatOne')}
                aria-pressed={repeatMode !== 'off'}
              >
                {repeatMode === 'one' ? <Repeat1 size={19} /> : <Repeat size={19} />}
              </button>
              <button onClick={handleLike} className={liked ? smallActiveButton : smallButton} title={t('like')} aria-pressed={liked}><Heart size={19} fill={liked ? 'currentColor' : 'none'} /></button>
            </div>

            <div className="flex justify-between items-center gap-1 h-10 shrink-0" dir="ltr">
              <button onClick={handleDownload} className={smallButton} title={t('download')}><Download size={18} /></button>
              <SongShareButton song={song} className={smallButton} size={18} />
              <button onClick={() => void handleDownloadCover()} className={smallButton} title={t('shareCover')} aria-label={t('shareCover')}><ImageIcon size={18} /></button>
              <button onClick={toggleMute} className={smallButton} title={isMuted ? t('unmute') : t('mute')}>
                {isMuted ? <VolumeX size={18} /> : <Volume2 size={18} />}
              </button>
              <button onClick={openLyrics} className={smallButton} title={t('fullscreen')}><Maximize2 size={18} /></button>
            </div>
          </div>
        </div>
      </div>

      {previewLines.length > 0 && (
        <div
          className="mt-10 bg-tamarind rounded-3xl p-6 flex flex-col border border-transparent hover:border-white/20 transition-all overflow-hidden"
          dir={language === 'ar' ? 'rtl' : 'ltr'}
        >
          <div className="flex justify-between items-center gap-3 mb-3 shrink-0">
            <h2 className="text-xl font-bold text-camel-coat">{t('lyrics')}</h2>
            <button
              type="button"
              onClick={handleShowMore}
              className="text-xs text-boho hover:text-white transition font-bold"
            >
              {showMore ? t('showLess') : t('showMore')}
            </button>
          </div>
          <div
            onClick={openLyrics}
            className={`flex flex-col items-center gap-1 cursor-pointer ${showMore ? 'max-h-[320px] overflow-y-auto pr-1' : 'justify-center overflow-hidden min-h-[120px]'}`}
          >
            {previewLines.map((line, i) => (
              <p key={`${i}-${line.content}`} className={`w-full text-center text-base transition-all ${showMore && hasSynced && line.isActive ? 'text-rubine font-bold scale-105' : 'text-camel-coat/70'} ${!showMore ? 'truncate' : ''}`}>
                {line.content}
              </p>
            ))}
          </div>
        </div>
      )}

      {/* Lyrics share moved to FullScreenPlayer bottom bar (Step 5) */}
    </div>
  )
}