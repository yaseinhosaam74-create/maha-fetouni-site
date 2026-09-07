'use client'
import { useState, useEffect } from 'react'
import { useAudio } from './AudioContext'
import { useLanguage } from '@/app/context/LanguageContext'
import { Play, Pause, SkipBack, SkipForward, Download, Share2, Heart, Volume2, VolumeX } from 'lucide-react'
import toast from 'react-hot-toast'
import { db } from '@/lib/firebase'
import { doc, updateDoc, increment } from 'firebase/firestore'

export default function AudioPlayer() {
  const { currentSong, isPlaying, isMuted, currentTime, duration, togglePlay, toggleMute, seek, next, prev, playlist } = useAudio()
  const { language, t } = useLanguage()
  const [liked, setLiked] = useState(false)

  useEffect(() => {
    if (currentSong) {
      const saved = localStorage.getItem(`liked_${currentSong.id}`)
      if (saved === 'true') setLiked(true)
      else setLiked(false)
    }
  }, [currentSong])

  if (!currentSong) return null

  const title = language === 'ar' ? currentSong.titleAr || currentSong.titleEn : currentSong.titleEn || currentSong.titleAr
  const artist = language === 'ar' ? currentSong.artistAr || 'مهى فتوني' : currentSong.artistEn || 'Maha Fetouni'

  const handleDownload = async () => {
    try {
      const response = await fetch(currentSong.audioUrl)
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
      toast.error('تعذر التحميل، جرّب فتح الرابط في نافذة جديدة')
    }
  }

  const handleShare = async () => {
    const songUrl = `${window.location.origin}/songs/${currentSong.id}`
    const shareData = {
      title: title,
      text: `استمع إلى ${title} - ${artist}`,
      url: songUrl,
    }
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

  const handleLike = async () => {
    if (!currentSong) return
    const newLiked = !liked
    setLiked(newLiked)
    localStorage.setItem(`liked_${currentSong.id}`, String(newLiked))
    try {
      await updateDoc(doc(db, 'songs', currentSong.id), {
        likes: increment(newLiked ? 1 : -1),
      })
    } catch (error) {
      // تجاهل
    }
  }

  const formatTime = (sec: number) => {
    const minutes = Math.floor(sec / 60)
    const seconds = Math.floor(sec % 60)
    return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`
  }

  const progressPercent = duration ? (currentTime / duration) * 100 : 0

  // وظيفة التعامل مع النقر على شريط التقدم (تدعم RTL)
  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const isRTL = getComputedStyle(e.currentTarget).direction === 'rtl'
    let percent: number
    if (isRTL) {
      percent = (rect.right - e.clientX) / rect.width
    } else {
      percent = (e.clientX - rect.left) / rect.width
    }
    percent = Math.max(0, Math.min(1, percent))
    seek(percent * duration)
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 flex justify-center px-4 pb-4 pointer-events-none">
      <div className="pointer-events-auto w-full max-w-md bg-italian-roast/95 backdrop-blur-md border border-tamarind rounded-2xl shadow-2xl overflow-hidden">
        {/* شريط التقدم */}
        <div
          className="h-2 bg-tamarind cursor-pointer relative"
          onClick={handleProgressClick}
        >
          <div
            className="h-full bg-rubine"
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        <div className="p-4">
          <div className="flex items-center gap-4">
            <div className="relative w-14 h-14 shrink-0">
              <img
                src={currentSong.coverImageUrl}
                alt={title}
                className="w-full h-full object-cover rounded-lg"
              />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-camel-coat font-semibold truncate">{title}</p>
              <p className="text-boho text-sm truncate">{artist}</p>
            </div>
            <button
              onClick={handleLike}
              className={`${liked ? 'text-rubine' : 'text-camel-coat'} hover:text-rubine transition`}
            >
              <Heart size={20} fill={liked ? 'currentColor' : 'none'} />
            </button>
          </div>

          <div className="flex items-center justify-center gap-6 mt-3">
            <button onClick={prev} className="text-camel-coat hover:text-rubine transition">
              <SkipBack size={20} />
            </button>
            <button
              onClick={togglePlay}
              className="bg-rubine text-white p-3 rounded-full hover:bg-tamarind transition w-12 h-12 flex items-center justify-center"
            >
              {isPlaying ? <Pause size={22} /> : <Play size={22} />}
            </button>
            <button onClick={next} className="text-camel-coat hover:text-rubine transition">
              <SkipForward size={20} />
            </button>
          </div>

          <div className="flex items-center gap-2 mt-3">
            <span className="text-boho text-xs">{formatTime(currentTime)}</span>
            <div
              className="flex-1 h-1 bg-tamarind rounded-full cursor-pointer"
              onClick={handleProgressClick}
            >
              <div className="h-full bg-rubine rounded-full" style={{ width: `${progressPercent}%` }} />
            </div>
            <span className="text-boho text-xs">{formatTime(duration)}</span>
          </div>

          <div className="flex items-center justify-between mt-3">
            <div className="flex items-center gap-3">
              <button onClick={handleDownload} className="text-camel-coat hover:text-rubine transition">
                <Download size={18} />
              </button>
              <button onClick={handleShare} className="text-camel-coat hover:text-rubine transition">
                <Share2 size={18} />
              </button>
              <button onClick={toggleMute} className="text-camel-coat hover:text-rubine transition">
                {isMuted ? <VolumeX size={18} /> : <Volume2 size={18} />}
              </button>
            </div>
            <div className="text-boho text-xs">
              {playlist.length > 0 && `${playlist.length} أغنية`}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}