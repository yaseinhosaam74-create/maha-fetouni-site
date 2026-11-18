// lib/lyrics.ts
import { Lrc } from 'lrc-kit'

export interface LyricLine {
  time: number      // الوقت بالثواني
  content: string   // نص السطر
}

export interface ParsedLyrics {
  lines: LyricLine[]
  isSynced: boolean   // true إذا كانت الكلمات بصيغة LRC حقيقية
  offset: number      // إزاحة LRC بالثواني (إن وجدت)
}

/**
 * يتحقق إذا كان النص بصيغة LRC (يحتوي على توقيتات مثل [00:12.34])
 */
export function isLrcFormat(text: string): boolean {
  if (!text) return false
  // نبحث عن نمط التوقيت [mm:ss.xx] أو [mm:ss]
  const lrcPattern = /\[\d{1,2}:\d{1,2}(\.\d{1,3})?\]/
  return lrcPattern.test(text)
}

/**
 * يحلل النص إلى أسطر كلمات مع توقيتات
 * - إذا كان LRC: يستخدم lrc-kit للتحليل الدقيق
 * - إذا كان نصًا عاديًا: يوزع الأسطر تقديريًا على المدة
 */
export function parseLyrics(
  text: string,
  duration: number = 0
): ParsedLyrics {
  if (!text || text.trim() === '') {
    return { lines: [], isSynced: false, offset: 0 }
  }

  // الحالة 1: النص بصيغة LRC
  if (isLrcFormat(text)) {
    try {
      const lrc = Lrc.parse(text)
      const lines: LyricLine[] = lrc.lines.map((line) => ({
        time: line.time,
        content: line.content,
      }))
      // lrc-kit يخزن الـ offset في lrc.info.offset
      const offset = (lrc.info as any)?.offset
        ? parseFloat(String((lrc.info as any).offset)) / 1000
        : 0
      return { lines, isSynced: true, offset }
    } catch (e) {
      console.warn('Failed to parse LRC, falling back to plain text', e)
    }
  }

  // الحالة 2: نص عادي - نوزع الأسطر تقديريًا
  const rawLines = text
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => l.length > 0)

  if (rawLines.length === 0) {
    return { lines: [], isSynced: false, offset: 0 }
  }

  // إذا لم تكن المدة معروفة، نستخدم توزيعًا افتراضيًا (4 ثوانٍ لكل سطر)
  const effectiveDuration = duration > 0 ? duration : rawLines.length * 4
  const interval = effectiveDuration / rawLines.length

  const lines: LyricLine[] = rawLines.map((content, index) => ({
    time: index * interval,
    content,
  }))

  return { lines, isSynced: false, offset: 0 }
}

/**
 * يرجع مؤشر السطر النشط بناءً على الوقت الحالي
 * (آخر سطر وقتُه <= currentTime)
 */
export function getActiveLineIndex(
  lyrics: ParsedLyrics,
  currentTime: number
): number {
  if (!lyrics.lines.length) return -1
  const adjustedTime = currentTime - lyrics.offset

  let activeIndex = -1
  for (let i = 0; i < lyrics.lines.length; i++) {
    if (lyrics.lines[i].time <= adjustedTime) {
      activeIndex = i
    } else {
      break
    }
  }
  return activeIndex
}

/**
 * يرجع السطر النشط كنص (أو null إذا لم يوجد)
 */
export function getActiveLine(
  lyrics: ParsedLyrics,
  currentTime: number
): LyricLine | null {
  const index = getActiveLineIndex(lyrics, currentTime)
  return index >= 0 ? lyrics.lines[index] : null
}