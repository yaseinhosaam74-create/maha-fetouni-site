import type { Song } from './firestore'
import { getPublicSongUrl, getPublicSiteOrigin } from './shareCard'

export type NativeShareSong = Pick<
  Song,
  'id' | 'titleAr' | 'titleEn' | 'artistAr' | 'artistEn' | 'coverImageUrl'
>

export type ShareLanguage = 'ar' | 'en'

const SITE_TITLE = 'مها فتوني | Maha Ftouni'
const SITE_TEXT = 'اسمعي أغاني مها فتوني - الموقع الرسمي لأغاني وصور وكلمات مها فتوني'

type NativeShareData = ShareData & { files?: File[] }

function getLanguage(): ShareLanguage {
  if (typeof window === 'undefined') return 'ar'
  try {
    return window.localStorage.getItem('language') === 'en' ? 'en' : 'ar'
  } catch {
    return 'ar'
  }
}

function songName(song: NativeShareSong, language: ShareLanguage): string {
  return (language === 'ar' ? song.titleAr || song.titleEn : song.titleEn || song.titleAr) || SITE_TITLE
}

function artistName(song: NativeShareSong, language: ShareLanguage): string {
  return language === 'ar'
    ? song.artistAr || song.artistEn || 'مها فتوني'
    : song.artistEn || song.artistAr || 'Maha Ftouni'
}

function siteUrl(): string {
  return getPublicSiteOrigin() || 'https://maha-fetouni-site.vercel.app'
}

function isAbort(error: unknown): boolean {
  return error instanceof DOMException && error.name === 'AbortError'
}

async function copyLink(url: string): Promise<void> {
  if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(url)
  } else if (typeof document !== 'undefined') {
    const input = document.createElement('textarea')
    input.value = url
    input.style.position = 'fixed'
    input.style.opacity = '0'
    document.body.appendChild(input)
    input.select()
    document.execCommand('copy')
    document.body.removeChild(input)
  }
}

function showCopied(): void {
  void import('react-hot-toast').then(({ default: toast }) => {
    toast.success('تم النسخ')
  })
}

async function nativeShare(data: NativeShareData, fallbackUrl: string): Promise<boolean> {
  if (typeof navigator !== 'undefined' && typeof navigator.share === 'function') {
    try {
      await navigator.share(data)
      return true
    } catch (error) {
      if (isAbort(error)) return true
    }
  }
  try {
    await copyLink(fallbackUrl)
    showCopied()
  } catch {
    if (typeof window !== 'undefined') window.prompt('Copy link', fallbackUrl)
  }
  return false
}

async function urlToFile(url: string, fileName: string): Promise<File | null> {
  try {
    const response = await fetch(url, { mode: 'cors' })
    if (!response.ok) return null
    const blob = await response.blob()
    return new File([blob], fileName, { type: blob.type || 'image/jpeg' })
  } catch {
    return null
  }
}

export async function shareSite(): Promise<void> {
  const url = siteUrl()
  await nativeShare({ title: SITE_TITLE, text: SITE_TEXT, url }, url)
}

export async function shareSong(song: NativeShareSong): Promise<void> {
  const language = getLanguage()
  const title = songName(song, language)
  const text = `${title} - مها فتوني`
  const url = song.id ? getPublicSongUrl(song.id) : siteUrl()
  const data: NativeShareData = { title, text, url }

  const coverUrl = song.coverImageUrl || '/icons/icon-512x512.png'
  const coverFile = await urlToFile(coverUrl, 'cover.jpg')
  if (coverFile && typeof navigator !== 'undefined' && navigator.canShare?.({ files: [coverFile] })) {
    data.files = [coverFile]
  }

  await nativeShare(data, url)
}

function wrapCanvasText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number, maxLines: number): string[] {
  const words = text.split(/\s+/).filter(Boolean)
  const lines: string[] = []
  let current = ''
  for (const word of words) {
    const candidate = current ? `${current} ${word}` : word
    if (ctx.measureText(candidate).width <= maxWidth || !current) current = candidate
    else {
      lines.push(current)
      current = word
      if (lines.length === maxLines) break
    }
  }
  if (lines.length < maxLines && current) lines.push(current)
  return lines.slice(0, maxLines)
}

async function loadImage(url: string): Promise<HTMLImageElement | null> {
  return new Promise((resolve) => {
    const image = new window.Image()
    image.crossOrigin = 'anonymous'
    image.onload = () => resolve(image)
    image.onerror = () => resolve(null)
    image.src = url
  })
}

function drawCover(ctx: CanvasRenderingContext2D, image: HTMLImageElement, x: number, y: number, size: number): void {
  const scale = Math.max(size / image.width, size / image.height)
  const width = image.width * scale
  const height = image.height * scale
  ctx.drawImage(image, x + (size - width) / 2, y + (size - height) / 2, width, height)
}

function roundedRect(ctx: CanvasRenderingContext2D, x: number, y: number, width: number, height: number, radius: number): void {
  ctx.beginPath()
  ctx.moveTo(x + radius, y)
  ctx.arcTo(x + width, y, x + width, y + height, radius)
  ctx.arcTo(x + width, y + height, x, y + height, radius)
  ctx.arcTo(x, y + height, x, y, radius)
  ctx.arcTo(x, y, x + width, y, radius)
  ctx.closePath()
}

export async function renderLyricsImage(song: NativeShareSong, selectedLines: string[]): Promise<Blob> {
  const language = getLanguage()
  const title = songName(song, language)
  const artist = artistName(song, language)
  const coverUrl = song.coverImageUrl || '/icons/icon-512x512.png'
  const cover = await loadImage(coverUrl)
  const canvas = document.createElement('canvas')
  canvas.width = 1080
  canvas.height = 1350
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Canvas 2D unavailable')

  ctx.fillStyle = '#280B0F'
  ctx.fillRect(0, 0, 1080, 1350)
  if (cover) {
    ctx.save()
    ctx.globalAlpha = 0.45
    ctx.filter = 'blur(60px)'
    ctx.drawImage(cover, -160, -160, 1400, 1400)
    ctx.restore()
  }
  ctx.fillStyle = 'rgba(0,0,0,0.55)'
  ctx.fillRect(0, 0, 1080, 1350)

  const coverSize = 260
  const coverX = (1080 - coverSize) / 2
  ctx.save()
  roundedRect(ctx, coverX, 120, coverSize, coverSize, 36)
  ctx.clip()
  if (cover) drawCover(ctx, cover, coverX, 120, coverSize)
  else {
    ctx.fillStyle = '#7B2D2D'
    ctx.fillRect(coverX, 120, coverSize, coverSize)
  }
  ctx.restore()

  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.direction = language === 'ar' ? 'rtl' : 'ltr'
  ctx.fillStyle = '#FFFFFF'
  ctx.font = `900 ${language === 'ar' ? 62 : 54}px Arial, Helvetica, sans-serif`
  ctx.fillText(title, 540, 452)
  ctx.fillStyle = 'rgba(255,255,255,0.7)'
  ctx.font = '600 38px Arial, Helvetica, sans-serif'
  ctx.fillText(artist, 540, 512)

  const lines = selectedLines.map((line) => line.trim()).filter(Boolean).slice(0, 6)
  ctx.fillStyle = '#FFFFFF'
  ctx.font = `800 ${lines.length > 4 ? 52 : 64}px Arial, Helvetica, sans-serif`
  let cursor = 640
  for (const line of lines) {
    for (const wrapped of wrapCanvasText(ctx, line, 880, 2)) {
      ctx.fillText(wrapped, 540, cursor)
      cursor += 88
    }
    cursor += 18
  }

  ctx.font = '700 34px Arial, Helvetica, sans-serif'
  ctx.fillStyle = 'rgba(255,255,255,0.85)'
  ctx.direction = 'ltr'
  const url = song.id ? getPublicSongUrl(song.id) : siteUrl()
  ctx.fillText(url.replace(/^https?:\/\//, ''), 540, 1245)

  try {
    const qr = await loadImage(`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(url)}`)
    if (qr) {
      ctx.drawImage(qr, 450, 1110, 180, 180)
    }
  } catch {
    void 0
  }

  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob)
      else reject(new Error('Image blob failed'))
    }, 'image/png')
  })
}

function downloadBlob(blob: Blob, fileName: string): void {
  const href = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = href
  link.download = fileName
  document.body.appendChild(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(href)
}

export async function shareLyrics(song: NativeShareSong, selectedLines: string[]): Promise<void> {
  const language = getLanguage()
  const title = songName(song, language)
  const url = song.id ? getPublicSongUrl(song.id) : siteUrl()
  let file: File | null = null
  try {
    const blob = await renderLyricsImage(song, selectedLines)
    file = new File([blob], 'lyrics.png', { type: 'image/png' })
  } catch {
    file = null
  }

  if (file && typeof navigator !== 'undefined' && navigator.canShare?.({ files: [file] })) {
    await nativeShare(
      { files: [file], title, text: `${title} - مها فتوني\n${url}` },
      url
    )
    return
  }

  if (file) downloadBlob(file, 'lyrics.png')
  await nativeShare({ title, text: `${title} - مها فتوني\n${url}`, url }, url)
}
