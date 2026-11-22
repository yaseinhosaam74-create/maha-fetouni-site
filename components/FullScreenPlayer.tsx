'use client'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import toast from 'react-hot-toast'
import {
  Play, Pause, SkipBack, SkipForward, Shuffle, Repeat, Repeat1,
  Volume2, VolumeX, Loader2, Heart, Download, Image as ImageIcon,
  Maximize2, Minimize2, Share2,
} from 'lucide-react'
import { useAudio } from './AudioContext'
import { useLanguage } from '@/app/context/LanguageContext'
import { useSongLyrics } from '@/lib/useSongLyrics'
import { getActiveLineIndex } from '@/lib/lyrics'
import { likeSong, unlikeSong, isSongLiked } from '@/lib/firestore'
import { useDeviceId } from '@/lib/useLocalStorage'
import SongShareButton from './SongShareButton'
import { shareLyrics } from '@/lib/nativeShare'
import { forceUnlockBodyScroll, lockBodyScroll, unlockBodyScroll } from '@/lib/bodyScrollLock'

export default function FullScreenPlayer() {
  const {
    currentSong, fullscreenSong, isPlaying, isMuted, currentTime, duration,
    isShuffled, repeatMode, cycleRepeat, toggleShuffle, togglePlay, toggleMute,
    seek, next, prev, playSong, closeFullscreenPlayer,
  } = useAudio()
  const { language, t } = useLanguage()
  const deviceId = useDeviceId()

  const displaySong = fullscreenSong ?? currentSong
  const displaySongId = displaySong?.id
  const pathname = usePathname()
  const pathnameRef = useRef(pathname)
  const { lyrics, isLoading } = useSongLyrics(displaySong, language, duration)

  const [liked, setLiked] = useState(false)
  const [isUserScrolling, setIsUserScrolling] = useState(false)
  const [isBrowserFullscreen, setIsBrowserFullscreen] = useState(false)
  const [selectedLyricLines, setSelectedLyricLines] = useState<string[]>([])
  const [sharingLyrics, setSharingLyrics] = useState(false)

  const listRef = useRef<HTMLDivElement>(null)
  const playerRef = useRef<HTMLDivElement>(null)
  const closingRef = useRef(false)
  const isProgrammaticScrollRef = useRef(false)
  const resumeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const programmaticTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const previousFocusRef = useRef<HTMLElement | null>(null)
  const restorePageRef = useRef<() => void>(() => {})

  useEffect(() => {
    let cancelled = false
    setLiked(false)
    if (displaySongId && deviceId) {
      isSongLiked(displaySongId, deviceId)
        .then((value) => { if (!cancelled) setLiked(value) })
        .catch(() => undefined)
    }
    return () => { cancelled = true }
  }, [displaySongId, deviceId])

  const closePlayer = useCallback(() => {
    if (closingRef.current) return
    closingRef.current = true
    try {
      restorePageRef.current()
    } finally {
      closeFullscreenPlayer()
      const doc = document as Document & {
        webkitFullscreenElement?: Element
        webkitExitFullscreen?: () => Promise<void> | void
      }
      if (doc.fullscreenElement || doc.webkitFullscreenElement) {
        const exit = doc.exitFullscreen?.bind(doc) ?? doc.webkitExitFullscreen?.bind(doc)
        void Promise.resolve(exit?.()).catch(() => undefined)
      }
    }
  }, [closeFullscreenPlayer])

  const handleFullscreenButton = useCallback(() => {
    const doc = document as Document & {
      webkitFullscreenElement?: Element
      webkitExitFullscreen?: () => Promise<void> | void
    }
    const root = document.documentElement as HTMLElement & {
      webkitRequestFullscreen?: () => Promise<void> | void
    }
    const isFs = Boolean(doc.fullscreenElement || doc.webkitFullscreenElement)
    if (isFs) {
      closingRef.current = true
      try { restorePageRef.current() } finally { closeFullscreenPlayer() }
      const exit = doc.exitFullscreen?.bind(doc) ?? doc.webkitExitFullscreen?.bind(doc)
      void Promise.resolve(exit?.()).catch(() => undefined)
      return
    }
    setIsBrowserFullscreen(true)
    const req = root.requestFullscreen?.bind(root) ?? root.webkitRequestFullscreen?.bind(root)
    void Promise.resolve(req?.()).catch(() => setIsBrowserFullscreen(Boolean(doc.fullscreenElement || doc.webkitFullscreenElement)))
  }, [closeFullscreenPlayer])

  useEffect(() => {
    const doc = document as Document & { webkitFullscreenElement?: Element }
    const root = document.documentElement as HTMLElement & { webkitRequestFullscreen?: () => Promise<void> | void }
    if (!doc.fullscreenElement && !doc.webkitFullscreenElement) {
      const req = root.requestFullscreen?.bind(root) ?? root.webkitRequestFullscreen?.bind(root)
      void Promise.resolve(req?.()).catch(() => undefined)
    }
    const handleFullscreenChange = () => {
      const isFs = Boolean(doc.fullscreenElement || doc.webkitFullscreenElement)
      setIsBrowserFullscreen(isFs)
      if (!isFs && !closingRef.current) {
        closingRef.current = true
        try { restorePageRef.current() } finally { closeFullscreenPlayer() }
      }
    }
    setIsBrowserFullscreen(Boolean(doc.fullscreenElement || doc.webkitFullscreenElement))
    document.addEventListener('fullscreenchange', handleFullscreenChange)
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange)
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange)
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange)
    }
  }, [closeFullscreenPlayer])

  useEffect(() => { pathnameRef.current = pathname }, [pathname])

  useEffect(() => {
    lockBodyScroll()
    previousFocusRef.current = document.activeElement as HTMLElement | null
    playerRef.current?.focus()

    restorePageRef.current = () => {
      forceUnlockBodyScroll()
      const target = previousFocusRef.current
      if (target?.isConnected) target.focus()
    }

    const handleRouteUnlock = () => forceUnlockBodyScroll()
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        if (document.querySelector('[data-share-menu="true"]')) return
        closePlayer()
        return
      }
      if (event.key !== 'Tab') return
      const focusables = Array.from(
        playerRef.current?.querySelectorAll<HTMLElement>(
          'button:not([disabled]), [href], input, textarea, select, [tabindex]:not([tabindex="-1"])'
        ) ?? []
      ).filter((element) => element.offsetParent !== null)
      if (focusables.length === 0) return
      const first = focusables[0]
      const last = focusables[focusables.length - 1]
      const active = document.activeElement
      if (!playerRef.current?.contains(active)) { event.preventDefault(); first.focus() }
      else if (event.shiftKey && active === first) { event.preventDefault(); last.focus() }
      else if (!event.shiftKey && active === last) { event.preventDefault(); first.focus() }
    }
    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('popstate', handleRouteUnlock)
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('popstate', handleRouteUnlock)
      unlockBodyScroll()
    }
  }, [closePlayer])

  useEffect(() => {
    if (pathnameRef.current !== pathname) {
      forceUnlockBodyScroll()
      closeFullscreenPlayer()
    }
  }, [pathname, closeFullscreenPlayer])

  useEffect(() => () => {
    if (resumeTimerRef.current) clearTimeout(resumeTimerRef.current)
    if (programmaticTimerRef.current) clearTimeout(programmaticTimerRef.current)
  }, [])

  const activeIndex = useMemo(() => {
    if (lyrics.lines.length === 0) return -1
    if (lyrics.isSynced) return getActiveLineIndex(lyrics, currentTime)
    if (duration > 0 && currentTime > 0) {
      return Math.min(lyrics.lines.length - 1, Math.floor((currentTime / duration) * lyrics.lines.length))
    }
    return -1
  }, [lyrics, currentTime, duration])

  const scrollToActive = useCallback((index: number) => {
    const element = listRef.current?.querySelector<HTMLElement>(`[data-line-index="${index}"]`)
    if (!element) return
    isProgrammaticScrollRef.current = true
    element.scrollIntoView({ block: 'center', behavior: 'smooth' })
    if (programmaticTimerRef.current) clearTimeout(programmaticTimerRef.current)
    programmaticTimerRef.current = setTimeout(() => {
      isProgrammaticScrollRef.current = false
    }, 700)
  }, [])

  const markUserScroll = useCallback(() => {
    if (isProgrammaticScrollRef.current) return
    setIsUserScrolling(true)
    if (resumeTimerRef.current) clearTimeout(resumeTimerRef.current)
    resumeTimerRef.current = setTimeout(() => setIsUserScrolling(false), 3000)
  }, [])

  useEffect(() => {
    if (activeIndex < 0 || isUserScrolling) return
    scrollToActive(activeIndex)
  }, [activeIndex, isUserScrolling, scrollToActive])

  const handleSync = () => {
    if (resumeTimerRef.current) clearTimeout(resumeTimerRef.current)
    setIsUserScrolling(false)
    if (activeIndex >= 0) scrollToActive(activeIndex)
  }

  // fullscreen handled by handleFullscreenButton

  const handlePlayPause = () => {
    if (displaySong && displaySong.id !== currentSong?.id) playSong(displaySong)
    else togglePlay()
  }

  const handleNext = () => {
    if (displaySong && displaySong.id !== currentSong?.id) playSong(displaySong)
    else next()
  }

  const handlePrev = () => {
    if (displaySong && displaySong.id !== currentSong?.id) playSong(displaySong)
    else prev()
  }

  const toggleLyricSelection = (content: string) => {
    setSelectedLyricLines((current) => {
      if (current.includes(content)) return current.filter((line) => line !== content)
      if (current.length >= 5) return current
      return [...current, content]
    })
  }

  const handleLyricsShare = async () => {
    if (!displaySong || sharingLyrics) return
    setSharingLyrics(true)
    const lines = selectedLyricLines.length > 0
      ? selectedLyricLines
      : lyrics.lines.slice(Math.max(0, activeIndex - 1), activeIndex + 3).map((line) => line.content).filter(Boolean)
    try {
      await shareLyrics(displaySong, lines.length > 0 ? lines : lyrics.lines.map((line) => line.content).slice(0, 4))
    } catch {
      toast.error(t('shareFailed'))
    } finally {
      setSharingLyrics(false)
    }
  }

  const handleLike = async () => {
    if (!displaySong || !deviceId) return
    const nextLiked = !liked
    setLiked(nextLiked)
    try {
      if (nextLiked) await likeSong(displaySong.id, deviceId)
      else await unlikeSong(displaySong.id, deviceId)
    } catch (error) {
      setLiked(!nextLiked)
      console.error('[FullScreenPlayer] like failed:', error)
      toast.error(t('shareFailed'))
    }
  }

  const handleDownloadAudio = async () => {
    if (!displaySong) return
    try {
      const response = await fetch(displaySong.audioUrl)
      if (!response.ok) throw new Error(String(response.status))
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `${language === 'ar' ? displaySong.titleAr : displaySong.titleEn}.mp3`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)
      const title = language === 'ar' ? displaySong.titleAr || displaySong.titleEn : displaySong.titleEn || displaySong.titleAr
      toast.success(`${t('songDownloaded')} — ${title}`)
    } catch (error) {
      console.error('[FullScreenPlayer] audio download failed:', error)
      toast.error(t('shareFailed'))
    }
  }

  const handleDownloadCover = async () => {
    if (!displaySong) return
    try {
      const response = await fetch(displaySong.coverImageUrl)
      if (!response.ok) throw new Error(String(response.status))
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const title = language === 'ar' ? displaySong.titleAr || displaySong.titleEn : displaySong.titleEn || displaySong.titleAr
      const link = document.createElement('a')
      link.href = url
      link.download = `${title}-cover.jpg`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)
      toast.success(t('coverDownloaded'))
    } catch (error) {
      console.error('[FullScreenPlayer] cover download failed:', error)
      toast.error(t('shareFailed'))
    }
  }

  if (!displaySong) {
    return (
      <div className="fixed inset-0 z-[100] bg-black text-white flex flex-col items-center justify-center gap-6" dir={language === 'ar' ? 'rtl' : 'ltr'}>
        <p className="text-white/70">{t('selectSong')}</p>
      </div>
    )
  }

  const titles = {
    title: language === 'ar' ? displaySong.titleAr || displaySong.titleEn : displaySong.titleEn || displaySong.titleAr,
    artist: language === 'ar' ? displaySong.artistAr || 'مهى فتوني' : displaySong.artistEn || 'Maha Ftouni',
  }
  const coverImageUrl = displaySong.coverImageUrl
  const progressPercent = duration > 0 ? Math.min(100, (currentTime / duration) * 100) : 0
  const smallButton = 'w-11 h-11 shrink-0 rounded-full flex items-center justify-center text-white/65 hover:text-white hover:bg-white/10 transition'
  const repeatLabel = repeatMode === 'off' ? t('repeatOff') : repeatMode === 'all' ? t('repeatAll') : t('repeatOne')

  const formatTime = (seconds: number) => {
    if (!Number.isFinite(seconds)) return '0:00'
    const minutes = Math.floor(seconds / 60)
    const remaining = Math.floor(seconds % 60)
    return `${minutes}:${remaining < 10 ? '0' : ''}${remaining}`
  }

  const handleProgressClick = (event: React.MouseEvent<HTMLDivElement>) => {
    const rect = event.currentTarget.getBoundingClientRect()
    const isRTL = window.getComputedStyle(event.currentTarget).direction === 'rtl'
    const percent = isRTL
      ? (rect.right - event.clientX) / rect.width
      : (event.clientX - rect.left) / rect.width
    seek(Math.max(0, Math.min(1, percent)) * duration)
  }

  return (
    <div ref={playerRef} tabIndex={-1} className="fixed inset-0 z-[100] flex flex-col overflow-hidden bg-black text-white outline-none" dir={language === 'ar' ? 'rtl' : 'ltr'}>
      <div className="absolute inset-0 opacity-25 blur-[90px] scale-125 pointer-events-none">
        <Image src={coverImageUrl} alt="" fill unoptimized className="object-cover" />
      </div>

      <div className="relative z-10 flex items-center justify-center p-5 shrink-0">
        <span className="text-[11px] font-bold uppercase tracking-[0.3em] text-white/45">{t('nowPlaying')}</span>
      </div>

      <div className="relative z-10 flex-1 min-h-0 flex flex-col items-center justify-center px-6">
        <div className="relative w-[min(40vh,260px)] aspect-square shrink-0 rounded-3xl overflow-hidden shadow-[0_25px_80px_rgba(0,0,0,0.75)]">
          <Image src={coverImageUrl} alt={titles.title} fill unoptimized priority className="object-cover" />
        </div>

        <div className="w-full max-w-xl text-center mt-5 shrink-0">
          <h1 className="text-2xl md:text-3xl font-black truncate">{titles.title}</h1>
          <p className="text-sm text-white/55 mt-1 truncate">{titles.artist}</p>
        </div>

        <div className="relative w-full max-w-xl flex-1 min-h-0 mt-3">
          <div
            ref={listRef}
            onWheel={markUserScroll}
            onTouchStart={markUserScroll}
            onScroll={markUserScroll}
            className="h-full overflow-y-auto overflow-x-hidden py-10"
            style={{
              scrollbarWidth: 'none',
              msOverflowStyle: 'none',
              maskImage: 'linear-gradient(to bottom, transparent, black 12%, black 88%, transparent)',
              WebkitMaskImage: 'linear-gradient(to bottom, transparent, black 12%, black 88%, transparent)',
            }}
          >
            {isLoading ? (
              <div className="flex justify-center items-center h-full text-white/60">
                <Loader2 className="animate-spin me-2" size={20} /> {t('loading')}
              </div>
            ) : lyrics.lines.length === 0 ? (
              <p className="text-center text-white/50">{t('noLyrics')}</p>
            ) : (
              <div className="space-y-2">
                {lyrics.lines.map((line, index) => {
                  const isActive = index === activeIndex
                  return (
                    <p
                      key={`${index}-${line.content}`}
                      data-line-index={index}
                      onClick={() => {
                        toggleLyricSelection(line.content)
                        if (lyrics.isSynced) {
                          seek(line.time)
                          if (resumeTimerRef.current) clearTimeout(resumeTimerRef.current)
                          setIsUserScrolling(false)
                        }
                      }}
                      className={`text-center px-4 py-2 rounded-2xl transition-all duration-300 ${
                        isActive
                          ? 'text-white font-black text-xl md:text-3xl scale-[1.03]'
                          : selectedLyricLines.includes(line.content)
                            ? 'text-rubine font-bold text-lg md:text-2xl'
                            : 'text-white/35 text-base md:text-xl hover:text-white/60'
                      } cursor-pointer`}
                    >
                      {line.content}
                    </p>
                  )
                })}
              </div>
            )}
          </div>

          {isUserScrolling && activeIndex >= 0 && (
            <button
              onClick={handleSync}
              className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-2 px-4 py-2 rounded-full bg-white text-black text-xs font-bold shadow-xl hover:scale-105 transition"
            >
              {language === 'ar' ? 'مزامنة' : 'Sync'}
            </button>
          )}
        </div>
      </div>

      <div className="relative z-10 shrink-0 px-6 pb-6 pt-2">
        <div className="h-1.5 bg-white/15 rounded-full cursor-pointer" onClick={handleProgressClick}>
          <div className="h-full bg-white rounded-full" style={{ width: `${progressPercent}%` }} />
        </div>
        <div className="flex justify-between text-[11px] font-bold text-white/45 mt-2" dir="ltr">
          <span>{formatTime(currentTime)}</span>
          <span>{formatTime(duration)}</span>
        </div>

        <div className="flex items-center justify-center gap-3 mt-3">
          <button onClick={toggleShuffle} className={isShuffled ? `${smallButton} text-rubine bg-rubine/15` : smallButton} title={t('shuffle')} aria-label={t('shuffle')} aria-pressed={isShuffled}>
            <Shuffle size={19} />
          </button>
          <button onClick={handlePrev} className={smallButton} title={t('prevTrack')} aria-label={t('prevTrack')}>
            <SkipBack size={26} />
          </button>
          <button
            onClick={handlePlayPause}
            className="w-16 h-16 shrink-0 rounded-full bg-white text-black flex items-center justify-center hover:scale-105 transition"
            title={isPlaying ? t('pause') : t('play')}
            aria-label={isPlaying ? t('pause') : t('play')}
          >
            {isPlaying ? <Pause size={30} fill="currentColor" /> : <Play size={30} fill="currentColor" className="ms-1" />}
          </button>
          <button onClick={handleNext} className={smallButton} title={t('nextTrack')} aria-label={t('nextTrack')}>
            <SkipForward size={26} />
          </button>
          <button
            onClick={cycleRepeat}
            className={`${smallButton} ${repeatMode !== 'off' ? 'text-rubine bg-rubine/15' : ''}`}
            title={repeatLabel}
            aria-label={repeatLabel}
            aria-pressed={repeatMode !== 'off'}
          >
            {repeatMode === 'one' ? <Repeat1 size={19} /> : <Repeat size={19} />}
          </button>
        </div>

        <div className="flex items-center justify-between gap-2 mt-3">
          <button
            onClick={handleFullscreenButton}
            className={smallButton}
            title={isBrowserFullscreen ? t('exitFullscreen') : t('fullscreen')}
            aria-label={isBrowserFullscreen ? t('exitFullscreen') : t('fullscreen')}
          >
            {isBrowserFullscreen ? <Minimize2 size={20} /> : <Maximize2 size={20} />}
          </button>
          <button onClick={toggleMute} className={smallButton} title={isMuted ? t('unmute') : t('mute')} aria-label={isMuted ? t('unmute') : t('mute')}>
            {isMuted ? <VolumeX size={20} /> : <Volume2 size={20} />}
          </button>
          <SongShareButton song={displaySong} className={smallButton} size={20} />
          <button onClick={() => void handleDownloadCover()} className={smallButton} title={t('shareCover')} aria-label={t('shareCover')}>
            <ImageIcon size={20} />
          </button>
          <button onClick={() => void handleDownloadAudio()} className={smallButton} title={t('download')} aria-label={t('download')}>
            <Download size={20} />
          </button>
          <button onClick={() => void handleLike()} className={`${smallButton} ${liked ? 'text-rubine bg-rubine/15' : ''}`} title={t('like')} aria-label={t('like')} aria-pressed={liked}>
            <Heart size={20} fill={liked ? 'currentColor' : 'none'} />
          </button>
          <button onClick={() => void handleLyricsShare()} disabled={sharingLyrics} className={`${smallButton} gap-1 w-auto px-3`} title={t('shareLyrics')} aria-label={t('shareLyrics')}>
            <Share2 size={18} />
            <span className="text-xs font-bold">{selectedLyricLines.length > 0 ? `${selectedLyricLines.length}` : language === 'ar' ? 'مشاركة' : 'Share'}</span>
          </button>
        </div>
      </div>
    </div>
  )
}
