'use client'
import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react'
import { db } from '@/lib/firebase'
import { collection, query, where, getDocs, doc, updateDoc, increment } from 'firebase/firestore'
import { logAnalyticsEvent } from '@/lib/analytics'
import type { Song } from '@/lib/firestore'

export type { Song } from '@/lib/firestore'

export type RepeatMode = 'off' | 'all' | 'one'

type AudioContextType = {
  currentSong: Song | null
  isPlaying: boolean
  isMuted: boolean
  currentTime: number
  duration: number
  volume: number
  playlist: Song[]
  isShuffled: boolean
  repeatMode: RepeatMode
  isFullscreenPlayerOpen: boolean
  fullscreenSong: Song | null
  openFullscreenPlayer: (song?: Song) => void
  closeFullscreenPlayer: () => void
  toggleShuffle: () => void
  cycleRepeat: () => void
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
  const [isShuffled, setIsShuffled] = useState(false)
  const [repeatMode, setRepeatMode] = useState<RepeatMode>('off')
  const [isFullscreenPlayerOpen, setIsFullscreenPlayerOpen] = useState(false)
  const [fullscreenSong, setFullscreenSong] = useState<Song | null>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const playPromiseRef = useRef<Promise<void> | null>(null)
  const shuffleHistoryRef = useRef<string[]>([])
  const currentSongIdRef = useRef<string | null>(null)

  const nextRef = useRef<() => boolean>(() => false)
  const prevRef = useRef<() => void>(() => {})
  const repeatModeRef = useRef<RepeatMode>(repeatMode)
  const startPlaybackRef = useRef<() => void>(() => {})

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
          if (audioRef.current) {
            audioRef.current.src = firstSong.audioUrl
            audioRef.current.load()
          }
        }
      } catch (error) {
        console.error('Error fetching initial playlist:', error)
      }
    }
    fetchPlaylist()
  }, [])

  useEffect(() => {
    const audio = new Audio()
    audio.preload = 'auto'
    audioRef.current = audio

    const handleTimeUpdate = () => setCurrentTime(audio.currentTime)
    const handleLoadedMetadata = () => setDuration(audio.duration)
    const handleEnded = () => {
      if (repeatModeRef.current === 'one' && audioRef.current) {
        audioRef.current.currentTime = 0
        setCurrentTime(0)
        startPlaybackRef.current()
        return
      }
      const startedNext = nextRef.current()
      if (!startedNext) {
        setIsPlaying(false)
        setCurrentTime(0)
      }
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

  useEffect(() => {
    if (audioRef.current) audioRef.current.muted = isMuted
  }, [isMuted])

  useEffect(() => {
    if (audioRef.current) audioRef.current.volume = volume
  }, [volume])

  const cacheSongAudio = useCallback(async (song: Song) => {
    try {
      if ('caches' in window) {
        const cache = await caches.open('maha-ftouni-songs')
        const response = await fetch(song.audioUrl)
        if (response.ok) {
          await cache.put(song.audioUrl, response.clone())
        }
      }
    } catch {
      return
    }
  }, [])

  const startPlayback = useCallback(() => {
    const audio = audioRef.current
    if (!audio) return

    if (playPromiseRef.current) {
      playPromiseRef.current.catch(() => {})
      playPromiseRef.current = null
    }

    playPromiseRef.current = audio.play()
    playPromiseRef.current
      .then(() => setIsPlaying(true))
      .catch((error) => {
        if (error.name !== 'AbortError') console.error('Play failed:', error)
        setIsPlaying(false)
      })
      .finally(() => { playPromiseRef.current = null })
  }, [])

  useEffect(() => {
    repeatModeRef.current = repeatMode
  }, [repeatMode])

  useEffect(() => {
    startPlaybackRef.current = startPlayback
  }, [startPlayback])

  const playSong = useCallback((song: Song) => {
    const audio = audioRef.current
    if (!audio) return

    if (currentSongIdRef.current !== song.id) {
      shuffleHistoryRef.current.push(song.id)
      if (shuffleHistoryRef.current.length > 50) shuffleHistoryRef.current.shift()
      currentSongIdRef.current = song.id
    }

    if (playPromiseRef.current) {
      playPromiseRef.current.catch(() => {})
      playPromiseRef.current = null
    }

    audio.pause()
    audio.src = song.audioUrl
    audio.load()

    const onCanPlay = () => {
      audio.removeEventListener('canplay', onCanPlay)
      startPlayback()
    }
    audio.addEventListener('canplay', onCanPlay)

    setCurrentSong(song)
    setIsPlaying(false)
    setCurrentTime(0)

    updateDoc(doc(db, 'songs', song.id), { plays: increment(1) }).catch(() => {})
    logAnalyticsEvent('song_play', { songId: song.id, path: window.location.pathname })

    cacheSongAudio(song)
  }, [cacheSongAudio, startPlayback])

  const resumePlayback = useCallback(() => {
    const audio = audioRef.current
    if (!audio || !currentSong) return
    if (!audio.src) {
      playSong(currentSong)
      return
    }
    startPlayback()
  }, [currentSong, playSong, startPlayback])

  useEffect(() => {
    if (!('mediaSession' in navigator) || typeof MediaMetadata === 'undefined' || !currentSong) return

    navigator.mediaSession.metadata = new MediaMetadata({
      title: currentSong.titleAr || currentSong.titleEn,
      artist: currentSong.artistAr || 'مهى فتوني',
      album: currentSong.albumAr || 'أغنية',
      artwork: [{ src: currentSong.coverImageUrl, sizes: '512x512', type: 'image/jpeg' }],
    })

    const handlePlay = () => { resumePlayback() }
    const handlePause = () => {
      audioRef.current?.pause()
      setIsPlaying(false)
    }
    const handlePrevious = () => { prevRef.current() }
    const handleNext = () => { nextRef.current() }
    const handleSeek: MediaSessionActionHandler = (details) => {
      if (details.seekTime != null && audioRef.current) {
        audioRef.current.currentTime = details.seekTime
        setCurrentTime(details.seekTime)
      }
    }
    const setHandler = (action: MediaSessionAction, handler: MediaSessionActionHandler | null) => {
      try {
        navigator.mediaSession.setActionHandler(action, handler)
      } catch {
        return
      }
    }

    setHandler('play', handlePlay)
    setHandler('pause', handlePause)
    setHandler('previoustrack', handlePrevious)
    setHandler('nexttrack', handleNext)
    setHandler('seekto', handleSeek)

    return () => {
      navigator.mediaSession.metadata = null
      setHandler('play', null)
      setHandler('pause', null)
      setHandler('previoustrack', null)
      setHandler('nexttrack', null)
      setHandler('seekto', null)
    }
  }, [currentSong, resumePlayback])

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
      if (!audio.src || audio.src !== currentSong?.audioUrl) {
        if (currentSong) { playSong(currentSong); return }
      }
      startPlayback()
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

  const toggleShuffle = useCallback(() => {
    setIsShuffled((shuffled) => {
      shuffleHistoryRef.current = currentSong ? [currentSong.id] : []
      return !shuffled
    })
  }, [currentSong])

  const cycleRepeat = useCallback(() => {
    setRepeatMode((mode) => mode === 'off' ? 'all' : mode === 'all' ? 'one' : 'off')
  }, [])

  const next = useCallback((): boolean => {
    if (!currentSong || playlist.length === 0) return false
    const loopAll = repeatMode !== 'off'

    if (isShuffled) {
      const playedIds = new Set(shuffleHistoryRef.current)
      const candidates = playlist.filter((song) => song.id !== currentSong.id)
      const remaining = playlist.filter((song) => !playedIds.has(song.id))
      if (!loopAll && remaining.length === 0) return false
      const pool = loopAll ? candidates : remaining
      const choices = pool.length > 0 ? pool : candidates
      if (choices.length === 0) choices.push(playlist[0])
      playSong(choices[Math.floor(Math.random() * choices.length)])
      return true
    }

    const currentIndex = playlist.findIndex((song) => song.id === currentSong.id)
    if (!loopAll && currentIndex === playlist.length - 1) return false
    const nextIndex = currentIndex < 0 ? 0 : (currentIndex + 1) % playlist.length
    playSong(playlist[nextIndex])
    return true
  }, [currentSong, playlist, playSong, isShuffled, repeatMode])

  const prev = useCallback(() => {
    if (!currentSong || playlist.length === 0) return

    if (isShuffled) {
      const history = shuffleHistoryRef.current
      const currentPosition = history.lastIndexOf(currentSong.id)
      if (currentPosition > 0) {
        const previousSong = playlist.find((song) => song.id === history[currentPosition - 1])
        if (previousSong) {
          playSong(previousSong)
          return
        }
      }
      const audio = audioRef.current
      if (audio) { audio.currentTime = 0; setCurrentTime(0) }
      return
    }

    const currentIndex = playlist.findIndex((song) => song.id === currentSong.id)
    if (currentIndex > 0) {
      playSong(playlist[currentIndex - 1])
    } else {
      const audio = audioRef.current
      if (audio) { audio.currentTime = 0; setCurrentTime(0) }
    }
  }, [currentSong, playlist, playSong, isShuffled])

  useEffect(() => {
    nextRef.current = next
    prevRef.current = prev
  }, [next, prev])

  const setVolumeValue = (vol: number) => setVolume(vol)

  const selectSongForViewing = useCallback((song: Song) => {
    const audio = audioRef.current
    if (!audio) return
    if (playPromiseRef.current) {
      playPromiseRef.current.catch(() => {})
      playPromiseRef.current = null
    }
    audio.pause()
    audio.src = song.audioUrl
    audio.load()
    if (currentSongIdRef.current !== song.id) {
      shuffleHistoryRef.current.push(song.id)
      if (shuffleHistoryRef.current.length > 50) shuffleHistoryRef.current.shift()
      currentSongIdRef.current = song.id
    }
    setCurrentSong(song)
    setCurrentTime(0)
    setDuration(0)
    setIsPlaying(false)
  }, [])

  const openFullscreenPlayer = useCallback((song?: Song) => {
    const target = song ?? currentSong
    if (target && target.id !== currentSong?.id) selectSongForViewing(target)
    setFullscreenSong(target)
    setIsFullscreenPlayerOpen(true)
  }, [currentSong, selectSongForViewing])

  const closeFullscreenPlayer = useCallback(() => {
    setIsFullscreenPlayerOpen(false)
    setFullscreenSong(null)
  }, [])

  useEffect(() => {
    if (!isFullscreenPlayerOpen) return
    if (currentSong && fullscreenSong?.id !== currentSong.id) setFullscreenSong(currentSong)
  }, [currentSong, fullscreenSong?.id, isFullscreenPlayerOpen])

  return (
    <AudioContext.Provider value={{
      currentSong, isPlaying, isMuted, currentTime, duration, volume, playlist,
      isShuffled, repeatMode, isFullscreenPlayerOpen, fullscreenSong, openFullscreenPlayer, closeFullscreenPlayer,
      toggleShuffle, cycleRepeat, playSong, playSongFromPlaylist, togglePlay, toggleMute, seek, next, prev, setVolume: setVolumeValue, setPlaylist,
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
