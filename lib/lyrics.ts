// lib/lyrics.ts
import { Lrc, type Lyric } from 'lrc-kit'

export interface LyricLine {
  time: number
  content: string
}

export interface ParsedLyrics {
  lines: LyricLine[]
  isSynced: boolean
  offset: number
}

export interface VisibleLyricLine extends LyricLine {
  index: number
  isActive: boolean
}

const TIMESTAMP_PATTERN = /\[(\d{1,3}):(\d{1,2})(?:[.:](\d{1,3}))?\]/g
const OFFSET_PATTERN = /\[offset:\s*([+-]?\d+)\s*\]/i

export function isLrcFormat(text: string): boolean {
  if (!text) return false
  return /\[\d{1,3}:\d{1,2}(?:[.:]\d{1,3})?\]/.test(text)
}

function parseTimestamp(match: RegExpMatchArray): number {
  const minutes = Number(match[1]) || 0
  const seconds = Number(match[2]) || 0
  const fraction = match[3] ? Number(`0.${match[3]}`) : 0
  return minutes * 60 + seconds + fraction
}

function parseOffset(text: string): number {
  const match = text.match(OFFSET_PATTERN)
  if (!match) return 0
  const value = Number(match[1])
  return Number.isFinite(value) ? value / 1000 : 0
}

function parseLrcManually(text: string): LyricLine[] {
  const lines: LyricLine[] = []
  for (const rawLine of text.split(/\r\n|[\n\r]/)) {
    const timestamps = rawLine.match(TIMESTAMP_PATTERN)
    if (!timestamps || timestamps.length === 0) continue
    const content = rawLine.replace(TIMESTAMP_PATTERN, '').trim()
    if (!content) continue
    for (const stamp of timestamps) {
      const parsed = stamp.match(/\[(\d{1,3}):(\d{1,2})(?:[.:](\d{1,3}))?\]/)
      if (!parsed) continue
      lines.push({ time: parseTimestamp(parsed), content })
    }
  }
  return lines.sort((a, b) => a.time - b.time)
}

export function parseLyrics(text: string, duration: number = 0): ParsedLyrics {
  if (!text || text.trim() === '') {
    return { lines: [], isSynced: false, offset: 0 }
  }

  if (isLrcFormat(text)) {
    let lines: LyricLine[] = []
    try {
      const lrc = Lrc.parse(text)
      lines = lrc.lyrics
        .map((line: Lyric) => ({ time: line.timestamp, content: line.content.trim() }))
        .filter((line: LyricLine) => line.content.length > 0)
        .sort((a: LyricLine, b: LyricLine) => a.time - b.time)
    } catch {
      lines = []
    }
    if (lines.length === 0) lines = parseLrcManually(text)
    if (lines.length > 0) {
      return { lines, isSynced: true, offset: parseOffset(text) }
    }
  }

  const rawLines = text
    .split(/\r\n|[\n\r]/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0)

  if (rawLines.length === 0) {
    return { lines: [], isSynced: false, offset: 0 }
  }

  const effectiveDuration = duration > 0 ? duration : rawLines.length * 4
  const interval = effectiveDuration / rawLines.length
  const lines: LyricLine[] = rawLines.map((content, index) => ({
    time: index * interval,
    content,
  }))

  return { lines, isSynced: false, offset: 0 }
}

export function getActiveLineIndex(lyrics: ParsedLyrics, currentTime: number): number {
  if (!lyrics.lines.length) return -1
  const adjustedTime = currentTime - lyrics.offset

  let activeIndex = -1
  for (let i = 0; i < lyrics.lines.length; i++) {
    if (lyrics.lines[i].time <= adjustedTime) activeIndex = i
    else break
  }
  return activeIndex
}

export function getActiveLine(lyrics: ParsedLyrics, currentTime: number): LyricLine | null {
  const index = getActiveLineIndex(lyrics, currentTime)
  return index >= 0 ? lyrics.lines[index] : null
}

export function getVisibleLyrics(
  lyrics: ParsedLyrics,
  currentTime: number,
  count: number = 4
): VisibleLyricLine[] {
  if (lyrics.lines.length === 0) return []
  const activeIndex = getActiveLineIndex(lyrics, currentTime)
  const safeCount = Math.max(1, Math.min(count, lyrics.lines.length))
  const anchor = Math.max(0, activeIndex)
  const start = Math.max(0, Math.min(anchor - 1, lyrics.lines.length - safeCount))
  const end = Math.min(lyrics.lines.length, start + safeCount)

  return lyrics.lines.slice(start, end).map((line, offset) => {
    const index = start + offset
    return { ...line, index, isActive: index === activeIndex }
  })
}
