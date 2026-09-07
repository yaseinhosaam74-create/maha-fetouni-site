'use client'
import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAudio } from './AudioContext'
import { useLanguage } from '@/app/context/LanguageContext'
import { Play, Pause, SkipBack, SkipForward, Download, Share2, Heart, Volume2, VolumeX, Music } from 'lucide-react'
import toast from 'react-hot-toast'
import { likeSong, unlikeSong, isSongLiked } from '@/lib/firestore'
import { logAnalyticsEvent } from '@/lib/analytics'

export default function FullScreenPlayer() {
  const { currentSong, isPlaying, isMuted, currentTime, duration, togglePlay, toggleMute, seek, next, prev, playlist } = useAudio()
  const { language } = useLanguage()
  const [liked, setLiked] = useState(false)
  const [deviceId, setDeviceId] = useState('')

  useEffect(() => {
    let stored = localStorage.getItem('deviceId')
    if (!stored) {
      stored = 'dev_' + Math.random().toString(36).substring(2, 15) + Date.now().toString(36)
      localStorage.setItem('deviceId', stored)
    }
    setDeviceId(stored)
  }, [])

  useEffect(() => {
    if (currentSong && deviceId) {
      isSongLiked(currentSong.id, deviceId).then(setLiked)
    }
  }, [currentSong, deviceId])

  if (!currentSong) {
    return (
      <div className="max-w-md mx-auto bg-italian-roast/80 backdrop-blur-md border border-tamarind rounded-3xl shadow-2xl p-8 text-center">
        <Music size={48} className="mx-auto mb-4 text-boho" />
        <p className="text-camel-coat text-lg">{language === 'ar' ? 'اختر أغنية لبدء التشغيل' : 'Select a song to start playing'}</p>
      </div>
    )
  }

  const title = language === 'ar' ? currentSong.titleAr || currentSong.titleEn : currentSong.titleEn || currentSong.titleAr
  const artist = language === 'ar' ? currentSong.artistAr || 'مهى فتوني' : currentSong.artistEn || 'Maha Fetouni'
  const lyrics = language === 'ar' ? currentSong.lyricsAr : currentSong.lyricsEn

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
      toast.error(language === 'ar' ? 'تعذر التحميل' : 'Download failed')
    }
  }

  const handleShare = async () => {
    const songUrl = `${window.location.origin}/songs/${currentSong.id}`
    const shareData = { title, text: `استمع إلى ${title} - ${artist}`, url: songUrl }
    if (navigator.share) {
      try { await navigator.share(shareData) } catch (error) { toast.error('تعذرت المشاركة') }
    } else {
      navigator.clipboard.writeText(songUrl)
      toast.success('تم نسخ رابط الأغنية')
    }
  }

  const handleLike = async () => {
    if (!currentSong || !deviceId) return
    try {
      if (liked) {
        await unlikeSong(currentSong.id, deviceId)
        setLiked(false)
      } else {
        await likeSong(currentSong.id, deviceId)
        setLiked(true)
        logAnalyticsEvent('song_like', { songId: currentSong.id })
      }
    } catch (error) {
      toast.error('تعذر تحديث الإعجاب')
    }
  }

  const formatTime = (sec: number) => {
    const minutes = Math.floor(sec / 60)
    const seconds = Math.floor(sec % 60)
    return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`
  }

  const progressPercent = duration ? (currentTime / duration) * 100 : 0

  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const isRTL = getComputedStyle(e.currentTarget).direction === 'rtl'
    let percent = isRTL ? (rect.right - e.clientX) / rect.width : (e.clientX - rect.left) / rect.width
    percent = Math.max(0, Math.min(1, percent))
    seek(percent * duration)
  }

  return (
    <div className="max-w-md mx-auto">
      <AnimatePresence mode="wait">
        <motion.div
          key={currentSong.id}
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 0.3 }}
          className="bg-italian-roast/80 backdrop-blur-md border border-tamarind rounded-3xl shadow-2xl overflow-hidden"
        >
          <div className="relative aspect-square overflow-hidden">
            <img src={currentSong.coverImageUrl} alt={title} className="w-full h-full object-cover" />
            <div className="absolute top-4 left-4 flex gap-2">
              <button onClick={handleShare} className="bg-black/20 backdrop-blur-md p-3 rounded-full text-white active:scale-90 transition"><Share2 size={16} /></button>
              <button onClick={toggleMute} className="bg-black/20 backdrop-blur-md p-3 rounded-full text-white active:scale-90 transition">{isMuted ? <VolumeX size={16} /> : <Volume2 size={16} />}</button>
            </div>
          </div>

          <div className="p-6">
            <div className="text-center mb-6">
              <h2 className="text-2xl font-black text-camel-coat mb-1">{title}</h2>
              <p className="text-xs uppercase tracking-widest text-boho">{artist}</p>
            </div>

            <div className="px-2 mb-6">
              <div className="h-2 bg-tamarind rounded-full cursor-pointer" onClick={handleProgressClick}>
                <div className="h-full bg-rubine rounded-full" style={{ width: `${progressPercent}%` }} />
              </div>
              <div className="flex justify-between text-xs font-bold opacity-60 mt-2">
                <span>{formatTime(currentTime)}</span>
                <span>{formatTime(duration)}</span>
              </div>
            </div>

            <div className="flex justify-between items-center px-4 mb-6">
              <button onClick={handleDownload} className="text-camel-coat hover:text-rubine transition"><Download size={18} /></button>
              <div className="flex items-center gap-6">
                <button onClick={prev} className="text-camel-coat hover:text-rubine transition"><SkipBack size={24} /></button>
                <button onClick={togglePlay} className="bg-rubine text-white p-4 rounded-full hover:bg-tamarind transition w-16 h-16 flex items-center justify-center">{isPlaying ? <Pause size={28} /> : <Play size={28} />}</button>
                <button onClick={next} className="text-camel-coat hover:text-rubine transition"><SkipForward size={24} /></button>
              </div>
              <button onClick={handleLike} className={`${liked ? 'text-rubine' : 'text-camel-coat'} hover:text-rubine transition`}><Heart size={18} fill={liked ? 'currentColor' : 'none'} /></button>
            </div>

            {lyrics && (
              <div className="bg-tamarind rounded-2xl p-4 max-h-40 overflow-y-auto custom-scroll text-center leading-relaxed text-camel-coat/80 italic font-medium">
                <p className="whitespace-pre-line">{lyrics}</p>
              </div>
            )}
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  )
}