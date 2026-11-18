'use client'
import { useState, useEffect, useMemo, useRef } from 'react'
import { useAudio } from './AudioContext'
import { useLanguage } from '@/app/context/LanguageContext'
import { Play, Pause, SkipBack, SkipForward, Download, Share2, Heart, Volume2, VolumeX, Music, Image as ImageIcon, Loader2, ChevronUp } from 'lucide-react'
import toast from 'react-hot-toast'
import { likeSong, unlikeSong, isSongLiked } from '@/lib/firestore'
import { logAnalyticsEvent } from '@/lib/analytics'
import FullScreenLyrics from './FullScreenLyrics'
import { Lrc } from 'lrc-kit'
import { toPng } from 'html-to-image'

export default function FullScreenPlayer() {
  const { currentSong, isPlaying, isMuted, currentTime, duration, togglePlay, toggleMute, seek, next, prev } = useAudio()
  const { language } = useLanguage()
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
    if (currentSong && deviceId) {
      isSongLiked(currentSong.id, deviceId).then(setLiked)
    }
  }, [currentSong, deviceId])

  const displayLyrics = useMemo(() => {
    if (!currentSong) return { lines: [], activeIndex: 0 }
    const synced = language === 'ar' ? currentSong.syncedLyricsAr : currentSong.syncedLyricsEn
    const plain = language === 'ar' ? currentSong.lyricsAr : currentSong.lyricsEn

    let textToParse = ''
    if (synced && synced.includes('[')) { textToParse = synced } 
    else if (plain && duration > 0) {
      const lines = plain.split('\n').map((l: string) => l.trim()).filter((l: string) => l !== '')
      if (lines.length === 0) return { lines: [], activeIndex: 0 }
      const timePerLine = duration / lines.length
      textToParse = lines.map((line: string, index: number) => {
        const time = index * timePerLine
        const mm = String(Math.floor(time / 60)).padStart(2, '0')
        const ss = String(Math.floor(time % 60)).padStart(2, '0')
        return `[${mm}:${ss}.00] ${line}`
      }).join('\n')
    } else { return { lines: [], activeIndex: 0 } }

    try {
      const parsed = Lrc.parse(textToParse).lyrics || []
      if (parsed.length === 0) return { lines: [], activeIndex: 0 }
      let activeIdx = 0
      for (let i = 0; i < parsed.length; i++) {
        if (currentTime >= parsed[i].timestamp) activeIdx = i
        else break
      }
      const start = Math.max(0, activeIdx - 1)
      const end = Math.min(parsed.length, start + 4)
      return { lines: parsed.slice(start, end).map((l: any) => l.content), activeIndex: activeIdx - start }
    } catch (e) { return { lines: [], activeIndex: 0 } }
  }, [currentSong, currentTime, language, duration])

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
  const plainLyrics = language === 'ar' ? currentSong.lyricsAr : currentSong.lyricsEn
  const syncedLyrics = language === 'ar' ? currentSong.syncedLyricsAr : currentSong.syncedLyricsEn

  const handleDownload = async () => { /* كود التحميل */ }
  const handleShareLink = async () => { /* كود مشاركة الرابط */ }
  const handleShareImage = async () => { /* كود مشاركة الصورة */ }
  const handleLike = async () => { /* كود الإعجاب */ }

  const formatTime = (sec: number) => {
    const minutes = Math.floor(sec / 60)
    const seconds = Math.floor(sec % 60)
    return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`
  }

  const progressPercent = duration ? (currentTime / duration) * 100 : 0
  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => { /* كود شريط التقدم */ }

  return (
    <div className="max-w-md mx-auto w-full">
      <div className="bg-italian-roast/80 backdrop-blur-md border border-tamarind rounded-3xl shadow-2xl overflow-hidden flex flex-col">
        
        <div className="relative w-full aspect-square shrink-0 overflow-hidden">
          <img src={currentSong.coverImageUrl} alt={title} className="w-full h-full object-cover" />
          <div className="absolute top-4 left-4 flex gap-2">
            <button onClick={handleShareLink} className="bg-black/20 backdrop-blur-md p-3 rounded-full text-white active:scale-90 transition"><Share2 size={16} /></button>
            <button onClick={handleShareImage} disabled={isGeneratingImg} className="bg-black/20 backdrop-blur-md p-3 rounded-full text-white active:scale-90 transition">
              {isGeneratingImg ? <Loader2 size={16} className="animate-spin" /> : <ImageIcon size={16} />}
            </button>
            <button onClick={toggleMute} className="bg-black/20 backdrop-blur-md p-3 rounded-full text-white active:scale-90 transition">{isMuted ? <VolumeX size={16} /> : <Volume2 size={16} />}</button>
          </div>
        </div>

        <div className="p-6">
          <div className="text-center mb-6 h-16 flex flex-col justify-center">
            <h2 className="text-2xl font-black text-camel-coat mb-1 truncate">{title}</h2>
            <p className="text-xs uppercase tracking-widest text-boho truncate">{artist}</p>
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

          {/* صندوق الكلمات (تم تثبيت الارتفاع هنا) */}
          <div 
            className="bg-tamarind/50 rounded-2xl p-4 cursor-pointer hover:bg-tamarind transition text-center h-[120px] flex flex-col justify-center items-center group border border-transparent hover:border-white/10 overflow-hidden relative"
            onClick={() => setIsLyricsOpen(true)}
          >
            <div className="space-y-1 w-full px-2">
              {displayLyrics.lines.length > 0 ? (
                displayLyrics.lines.map((line, idx) => (
                  <p key={idx} className={`text-sm truncate transition-all ${idx === displayLyrics.activeIndex ? 'text-rubine font-bold scale-105' : 'text-boho/60'}`}>
                    {line}
                  </p>
                ))
              ) : (
                <p className="text-sm text-boho">{language === 'ar' ? 'اضغط لعرض الكلمات' : 'Tap to view lyrics'}</p>
              )}
            </div>
            
            {/* زر عرض المزيد */}
            <div className="absolute bottom-0 left-0 w-full flex justify-center py-1 bg-gradient-to-t from-italian-roast/90 to-transparent">
              <span className="text-[10px] font-bold text-rubine flex items-center gap-1 group-hover:text-white transition">
                {language === 'ar' ? 'عرض المزيد' : 'Show More'} <ChevronUp size={12} />
              </span>
            </div>
          </div>

        </div>
      </div>

      <FullScreenLyrics 
        isOpen={isLyricsOpen}
        onClose={() => setIsLyricsOpen(false)}
        lrcText={syncedLyrics}
        plainText={plainLyrics}
        currentTime={currentTime}
        duration={duration}
        title={title}
        artist={artist}
        onSeek={seek}
        coverImageUrl={currentSong.coverImageUrl}
      />
    </div>
  )
}