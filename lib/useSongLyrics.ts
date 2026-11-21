'use client'
import { useEffect, useMemo, useState } from 'react'
import type { Song } from './firestore'
import { parseLyrics, type ParsedLyrics } from './lyrics'

const lrcFileCache = new Map<string, string>()

type LyricsSource = 'file' | 'firestore' | 'plain' | 'none'

function getLrcUrl(song: Song | null | undefined, language: 'ar' | 'en'): string | undefined {
  if (!song) return undefined
  if (language === 'ar') return song.lrcUrlAr || song.lrcUrl
  return song.lrcUrlEn || song.lrcUrl
}

export function useSongLyrics(
  song: Song | null | undefined,
  language: 'ar' | 'en',
  duration: number = 0
): {
  lyrics: ParsedLyrics
  source: LyricsSource
  isLoading: boolean
  syncedText: string
  plainText: string
} {
  const lrcUrl = getLrcUrl(song, language)
  const syncedText =
    language === 'ar' ? song?.syncedLyricsAr || '' : song?.syncedLyricsEn || ''
  const plainText = language === 'ar' ? song?.lyricsAr || '' : song?.lyricsEn || ''
  const [fileLrc, setFileLrc] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    let cancelled = false
    if (!lrcUrl) {
      setFileLrc('')
      setIsLoading(false)
      return
    }

    const cached = lrcFileCache.get(lrcUrl)
    if (cached !== undefined) {
      setFileLrc(cached)
      setIsLoading(false)
      return
    }

    setIsLoading(true)
    fetch(lrcUrl)
      .then((response) => (response.ok ? response.text() : ''))
      .then((text) => {
        if (cancelled) return
        if (text) lrcFileCache.set(lrcUrl, text)
        setFileLrc(text)
      })
      .catch(() => {
        if (!cancelled) setFileLrc('')
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [lrcUrl])

  const activeSyncedText = fileLrc || syncedText
  const sourceText = activeSyncedText || plainText
  const lyrics = useMemo(() => parseLyrics(sourceText, duration), [sourceText, duration])
  const source: LyricsSource = fileLrc
    ? 'file'
    : syncedText
      ? 'firestore'
      : plainText
        ? 'plain'
        : 'none'

  return { lyrics, source, isLoading, syncedText: activeSyncedText, plainText }
}
