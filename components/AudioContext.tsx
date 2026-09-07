'use client'
import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react'
import { db } from '@/lib/firebase'
import { collection, query, where, getDocs, doc, updateDoc, increment } from 'firebase/firestore'
import { logAnalyticsEvent } from '@/lib/analytics'

export type Song = {
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

type AudioContextType = {
  currentSong: Song | null
  isPlaying: boolean
  isMuted: boolean
  currentTime: number
  duration: number
  volume: number
  playlist: Song[]
  playSong: (song: Song) => void
  playSongFromPlaylist: (songs: Song[], song: Song) => void
  togglePlay: () => void
  toggleMute: () => void
  seek: (time: number) => void
  next: () => void
  prev: () => void
  setVolume: (vol: number) => void
  setPlaylist: (songs: Song[]) => void
}

const AudioContext = createContext<AudioContextType | null>(null)

export function AudioProvider({ children }: { children: React.ReactNode }) {
  const [currentSong, setCurrentSong] = useState<Song | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [isMuted, setIsMuted] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [volume, setVolume] = useState(1)
  const [playlist, setPlaylist] = useState<Song[]>([])
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const playPromiseRef = useRef<Promise<void> | null>(null)

  const nextRef = useRef<() => void>(() => {})
  const prevRef = useRef<() => void>(() => {})

  // جلب الأغاني واختيار الأولى
  useEffect(() => {
    const fetchPlaylist = async () => {
      try {
        const q = query(collection(db, 'songs'), where('isPublished', '==', true))
        const snapshot = await getDocs(q)
        const songsList = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as Song))
        setPlaylist(songsList)
        if (songsList.length > 0) {
          const firstSong = songsList[0]
          setCurrentSong(firstSong)
          // تحميل مصدر الأغنية الأولى مسبقًا بدون تشغيل
          if (audioRef.current) {
            audioRef.current.src = firstSong.audioUrl
            audioRef.current.load()
          }
          // تحديث Media Session فورًا
          setupMediaSession(firstSong)
        }
      } catch (error) {
        console.error('Error fetching initial playlist:', error)
      }
    }
    fetchPlaylist()
  }, [])

  // إعداد عنصر الصوت مرة واحدة
  useEffect(() => {
    const audio = new Audio()
    audio.preload = 'auto'
    audioRef.current = audio

    const handleTimeUpdate = () => setCurrentTime(audio.currentTime)
    const handleLoadedMetadata = () => setDuration(audio.duration)
    const handleEnded = () => {
      setIsPlaying(false)
      setCurrentTime(0)
      nextRef.current()
    }

    audio.addEventListener('timeupdate', handleTimeUpdate)
    audio.addEventListener('loadedmetadata', handleLoadedMetadata)
    audio.addEventListener('ended', handleEnded)

    return () => {
      if (playPromiseRef.current) {
        playPromiseRef.current.catch(() => {})
        playPromiseRef.current = null
      }
      audio.pause()
      audio.src = ''
      audio.removeEventListener('timeupdate', handleTimeUpdate)
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata)
      audio.removeEventListener('ended', handleEnded)
      audioRef.current = null
    }
  }, [])

  // تطبيق الكتم
  useEffect(() => {
    if (audioRef.current) audioRef.current.muted = isMuted
  }, [isMuted])

  // تطبيق مستوى الصوت
  useEffect(() => {
    if (audioRef.current) audioRef.current.volume = volume
  }, [volume])

  const cacheSongAudio = async (song: Song) => {
    try {
      if ('caches' in window) {
        const cache = await caches.open('maha-ftouni-songs')
        const response = await fetch(song.audioUrl)
        if (response.ok) {
          await cache.put(song.audioUrl, response.clone())
        }
      }
    } catch (error) {
      console.error('Error caching song:', error)
    }
  }

  const setupMediaSession = (song: Song) => {
    if ('mediaSession' in navigator) {
      navigator.mediaSession.metadata = new MediaMetadata({
        title: song.titleAr || song.titleEn,
        artist: song.artistAr || 'مهى فتوني',
        album: song.albumAr || 'أغنية',
        artwork: [{ src: song.coverImageUrl, sizes: '512x512', type: 'image/jpeg' }],
      })
      navigator.mediaSession.setActionHandler('play', () => {
        playSong(song)
      })
      navigator.mediaSession.setActionHandler('pause', () => {
        audioRef.current?.pause()
        setIsPlaying(false)
      })
      navigator.mediaSession.setActionHandler('previoustrack', () => {
        prevRef.current()
      })
      navigator.mediaSession.setActionHandler('nexttrack', () => {
        nextRef.current()
      })
      navigator.mediaSession.setActionHandler('seekto', (details) => {
        if (details.seekTime != null && audioRef.current) {
          audioRef.current.currentTime = details.seekTime
          setCurrentTime(details.seekTime)
        }
      })
    }
  }

  // تشغيل أغنية بأمان
  const playSong = useCallback((song: Song) => {
    const audio = audioRef.current
    if (!audio) return

    if (playPromiseRef.current) {
      playPromiseRef.current.catch(() => {})
      playPromiseRef.current = null
    }

    audio.pause()
    audio.src = song.audioUrl
    audio.load()

    const onCanPlay = () => {
      audio.removeEventListener('canplay', onCanPlay)
      playPromiseRef.current = audio.play()
      playPromiseRef.current
        .then(() => setIsPlaying(true))
        .catch((error) => {
          if (error.name !== 'AbortError') {
            console.error('Play failed:', error)
          }
          setIsPlaying(false)
        })
        .finally(() => {
          playPromiseRef.current = null
        })
    }
    audio.addEventListener('canplay', onCanPlay)

    setCurrentSong(song)
    setIsPlaying(false)
    setCurrentTime(0)

    updateDoc(doc(db, 'songs', song.id), { plays: increment(1) }).catch(() => {})
    logAnalyticsEvent('song_play', { songId: song.id, path: window.location.pathname })

    cacheSongAudio(song)
    setupMediaSession(song)
  }, [])

  const playSongFromPlaylist = (songs: Song[], song: Song) => {
    setPlaylist(songs)
    playSong(song)
  }

  const togglePlay = () => {
    const audio = audioRef.current
    if (!audio) return

    if (isPlaying) {
      audio.pause()
      setIsPlaying(false)
    } else {
      // إذا لم يكن هناك مصدر محمّل، نشغّل الأغنية الحالية من جديد
      if (!audio.src || audio.src !== currentSong?.audioUrl) {
        if (currentSong) {
          playSong(currentSong)
          return
        }
      }
      if (playPromiseRef.current) {
        playPromiseRef.current.catch(() => {})
        playPromiseRef.current = null
      }
      playPromiseRef.current = audio.play()
      playPromiseRef.current
        .then(() => setIsPlaying(true))
        .catch((error) => {
          if (error.name !== 'AbortError') {
            console.error('Toggle play failed:', error)
          }
          setIsPlaying(false)
        })
        .finally(() => {
          playPromiseRef.current = null
        })
    }
  }

  const toggleMute = () => setIsMuted((prev) => !prev)

  const seek = (time: number) => {
    const audio = audioRef.current
    if (audio) {
      audio.currentTime = time
      setCurrentTime(time)
    }
  }

  const next = useCallback(() => {
    if (!currentSong || playlist.length === 0) return
    const currentIndex = playlist.findIndex((s) => s.id === currentSong.id)
    if (currentIndex > -1 && currentIndex < playlist.length - 1) {
      playSong(playlist[currentIndex + 1])
    }
  }, [currentSong, playlist, playSong])

  const prev = useCallback(() => {
    if (!currentSong || playlist.length === 0) return
    const currentIndex = playlist.findIndex((s) => s.id === currentSong.id)
    if (currentIndex > 0) {
      playSong(playlist[currentIndex - 1])
    } else {
      const audio = audioRef.current
      if (audio) {
        audio.currentTime = 0
        setCurrentTime(0)
      }
    }
  }, [currentSong, playlist, playSong])

  useEffect(() => {
    nextRef.current = next
    prevRef.current = prev
  }, [next, prev])

  const setVolumeValue = (vol: number) => setVolume(vol)

  return (
    <AudioContext.Provider value={{
      currentSong,
      isPlaying,
      isMuted,
      currentTime,
      duration,
      volume,
      playlist,
      playSong,
      playSongFromPlaylist,
      togglePlay,
      toggleMute,
      seek,
      next,
      prev,
      setVolume: setVolumeValue,
      setPlaylist,
    }}>
      {children}
    </AudioContext.Provider>
  )
}

export const useAudio = () => {
  const context = useContext(AudioContext)
  if (!context) throw new Error('useAudio must be used within AudioProvider')
  return context
}