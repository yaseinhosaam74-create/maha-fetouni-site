import type { CoverPalette } from './coverColors'

export const SHARE_WATERMARK = 'MahaFtouni'

export type ShareCardMode = 'song' | 'lyrics'
export type CardStyle = 'classic' | 'wide' | 'narrow' | 'slanted'
export type CardBackground = 'black' | 'darkGrey' | 'lightGrey' | 'white' | 'gradient' | 'cover'
export type CardAlign = 'right' | 'center' | 'left'
export type FontSize = 'S' | 'M' | 'L'
export type Sticker = 'none' | 'heart' | 'star' | 'sparkle'

export type ShareCardOptions = {
  mode: ShareCardMode
  style: CardStyle
  background: CardBackground
  align: CardAlign
  fontSize: FontSize
  lyricsColor: string
  showWatermark: boolean
  sticker: Sticker
}

export type ShareCardData = {
  coverUrl: string
  backgroundUrl?: string
  palette: CoverPalette
  lines: string[]
  title: string
  subtitle?: string
  artist: string
  language: 'ar' | 'en'
}

type CardDimensions = { width: number; height: number }

export const CARD_STYLES: Record<CardStyle, CardDimensions & { label: string }> = {
  classic: { width: 1080, height: 1080, label: '1:1' },
  wide: { width: 1920, height: 1080, label: '16:9' },
  narrow: { width: 1080, height: 1920, label: '9:16' },
  slanted: { width: 1200, height: 1200, label: 'Slanted' },
}

export const DEFAULT_SHARE_OPTIONS: ShareCardOptions = {
  mode: 'lyrics',
  style: 'classic',
  background: 'gradient',
  align: 'center',
  fontSize: 'M',
  lyricsColor: '#FFFFFF',
  showWatermark: true,
  sticker: 'none',
}

const BACKGROUND_COLORS: Record<CardBackground, string | null> = {
  black: '#000000',
  darkGrey: '#1F1F1F',
  lightGrey: '#D9D9D9',
  white: '#FFFFFF',
  gradient: null,
  cover: null,
}

const imageCache = new Map<string, HTMLImageElement | null>()

export function getPublicSongUrl(songId: string): string {
  const base = getPublicSiteOrigin()
  if (!songId) return base
  return base ? `${base}/songs/${songId}` : `/songs/${songId}`
}

export function getPublicSiteOrigin(): string {
  const configured = process.env.NEXT_PUBLIC_SITE_URL?.trim().replace(/\/+$/, '')
  if (configured && !/localhost|127\.0\.0\.1|0\.0\.0\.0|\[?::1\]?/i.test(configured)) {
    return configured
  }
  if (typeof window === 'undefined') return ''
  const host = window.location.hostname.toLowerCase()
  if (host === 'localhost' || host === '127.0.0.1' || host === '0.0.0.0' || host === '::1') {
    return window.location.origin
  }
  return window.location.origin
}

export function buildShareCaption(data: {
  title: string
  artist: string
  lines: string[]
}): string {
  const unique = Array.from(new Set(data.lines.map((line) => line.trim()).filter(Boolean)))
  const lyricPart = unique.map((line) => `“${line}”`).join('\n')
  return [lyricPart, `${data.title} - ${data.artist} - ${SHARE_WATERMARK}`].filter(Boolean).join('\n\n')
}

export function buildSongShareCaption(data: {
  title: string
  artist: string
}, url = ''): string {
  return [`${data.title} - ${data.artist} - ${SHARE_WATERMARK}`, url].filter(Boolean).join('\n')
}

function loadImage(url: string): Promise<HTMLImageElement | null> {
  if (!url) return Promise.resolve(null)
  const cached = imageCache.get(url)
  if (cached !== undefined) return Promise.resolve(cached)
  return new Promise((resolve) => {
    const image = new window.Image()
    image.crossOrigin = 'anonymous'
    image.onload = () => {
      imageCache.set(url, image)
      resolve(image)
    }
    image.onerror = () => {
      imageCache.set(url, null)
      resolve(null)
    }
    image.src = url
  })
}

function fontFamily(): string {
  if (typeof window === 'undefined') return 'sans-serif'
  return window.getComputedStyle(document.body).fontFamily || 'sans-serif'
}

function isLightBackground(background: CardBackground): boolean {
  return background === 'white' || background === 'lightGrey'
}

function paintBackdrop(
  ctx: CanvasRenderingContext2D,
  options: ShareCardOptions,
  data: ShareCardData,
  backgroundImage: HTMLImageElement | null,
  width: number,
  height: number
) {
  if (options.background === 'cover' && backgroundImage) {
    paintCover(ctx, backgroundImage, 0, 0, width, height)
    ctx.fillStyle = 'rgba(0,0,0,0.58)'
    ctx.fillRect(0, 0, width, height)
    return
  }
  if (options.background === 'gradient') {
    const [first = '#7B2D2D', second = '#C6B39A', third = '#280B0F'] = data.palette.palette
    const gradient = ctx.createLinearGradient(0, 0, width, height)
    gradient.addColorStop(0, first)
    gradient.addColorStop(0.55, second)
    gradient.addColorStop(1, third)
    ctx.fillStyle = gradient
    ctx.fillRect(0, 0, width, height)
    ctx.fillStyle = 'rgba(0,0,0,0.22)'
    ctx.fillRect(0, 0, width, height)
    return
  }
  ctx.fillStyle = BACKGROUND_COLORS[options.background] || '#000000'
  ctx.fillRect(0, 0, width, height)
}

function paintCover(
  ctx: CanvasRenderingContext2D,
  image: HTMLImageElement,
  x: number,
  y: number,
  width: number,
  height: number
) {
  const scale = Math.max(width / image.width, height / image.height)
  const drawWidth = image.width * scale
  const drawHeight = image.height * scale
  ctx.drawImage(image, x + (width - drawWidth) / 2, y + (height - drawHeight) / 2, drawWidth, drawHeight)
}

function roundedRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number
) {
  const r = Math.min(radius, width / 2, height / 2)
  ctx.beginPath()
  ctx.moveTo(x + r, y)
  ctx.lineTo(x + width - r, y)
  ctx.quadraticCurveTo(x + width, y, x + width, y + r)
  ctx.lineTo(x + width, y + height - r)
  ctx.quadraticCurveTo(x + width, y + height, x + width - r, y + height)
  ctx.lineTo(x + r, y + height)
  ctx.quadraticCurveTo(x, y + height, x, y + height - r)
  ctx.lineTo(x, y + r)
  ctx.quadraticCurveTo(x, y, x + r, y)
  ctx.closePath()
}

function wrapText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
  const words = text.split(/\s+/).filter(Boolean)
  if (words.length === 0) return ['']
  const result: string[] = []
  let current = ''
  for (const word of words) {
    const candidate = current ? `${current} ${word}` : word
    if (ctx.measureText(candidate).width <= maxWidth || !current) current = candidate
    else {
      result.push(current)
      current = word
    }
  }
  if (current) result.push(current)
  return result
}

function drawWatermark(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  pad: number,
  primary: string,
  isLight: boolean
) {
  const logoSize = Math.max(34, pad * 0.55)
  const textSize = Math.max(28, pad * 0.42)
  const startX = pad
  const y = height - pad * 0.7 - logoSize

  ctx.save()
  roundedRect(ctx, startX, y, logoSize, logoSize, logoSize * 0.28)
  ctx.fillStyle = primary
  ctx.fill()
  ctx.fillStyle = isLight ? '#FFFFFF' : '#000000'
  ctx.font = `900 ${logoSize * 0.62}px Arial, Helvetica, sans-serif`
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.direction = 'ltr'
  ctx.fillText('M', startX + logoSize / 2, y + logoSize / 2 + logoSize * 0.02)

  ctx.fillStyle = primary
  ctx.font = `800 ${textSize}px Arial, Helvetica, sans-serif`
  ctx.textAlign = 'left'
  ctx.textBaseline = 'middle'
  ctx.fillText(SHARE_WATERMARK, startX + logoSize + textSize * 0.3, y + logoSize / 2)
  ctx.restore()
}

function drawSticker(
  ctx: CanvasRenderingContext2D,
  sticker: Sticker,
  width: number,
  height: number,
  pad: number,
  light: boolean
) {
  const glyphs: Record<Exclude<Sticker, 'none'>, string> = {
    heart: '♥',
    star: '★',
    sparkle: '✦',
  }
  if (sticker === 'none') return
  ctx.save()
  ctx.fillStyle = light ? '#7B2D2D' : '#FACC15'
  ctx.font = `900 ${Math.max(42, pad * 0.95)}px Arial, Helvetica, sans-serif`
  ctx.textAlign = 'right'
  ctx.textBaseline = 'bottom'
  ctx.direction = 'ltr'
  ctx.fillText(glyphs[sticker], width - pad, height - pad * 0.55)
  ctx.restore()
}

function fitTitle(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
  startSize: number,
  minSize: number
): { size: number; lines: string[] } {
  let size = startSize
  let lines: string[] = []
  for (;;) {
    ctx.font = `900 ${size}px ${fontFamily()}`
    lines = wrapText(ctx, text, maxWidth)
    const widest = lines.reduce((max, line) => Math.max(max, ctx.measureText(line).width), 0)
    if ((lines.length <= 2 && widest <= maxWidth) || size <= minSize) break
    size -= 2
  }
  return { size, lines: lines.slice(0, 2) }
}

export async function drawShareCard(
  canvas: HTMLCanvasElement,
  data: ShareCardData,
  options: ShareCardOptions
): Promise<void> {
  const { width, height } = CARD_STYLES[options.style]
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Canvas 2D context unavailable')

  ctx.clearRect(0, 0, width, height)
  const base = Math.min(width, height)
  const pad = base * 0.06
  const [cover, backgroundImage] = await Promise.all([
    loadImage(data.coverUrl),
    loadImage(data.backgroundUrl || data.coverUrl),
  ])
  const light = isLightBackground(options.background)
  const primary = light ? '#111111' : '#FFFFFF'
  const secondary = light ? '#444444' : 'rgba(255,255,255,0.72)'
  const rtl = data.language === 'ar'

  paintBackdrop(ctx, options, data, backgroundImage, width, height)

  const coverSize = base * (options.style === 'wide' ? 0.26 : 0.2)
  const coverX = pad
  const coverY = pad * 0.7
  ctx.save()
  roundedRect(ctx, coverX, coverY, coverSize, coverSize, base * 0.025)
  ctx.save()
  ctx.clip()
  if (cover) paintCover(ctx, cover, coverX, coverY, coverSize, coverSize)
  else {
    ctx.fillStyle = data.palette.palette[0] || '#7B2D2D'
    ctx.fillRect(coverX, coverY, coverSize, coverSize)
  }
  ctx.restore()
  ctx.strokeStyle = 'rgba(255,255,255,0.35)'
  ctx.lineWidth = Math.max(1, base * 0.003)
  roundedRect(ctx, coverX, coverY, coverSize, coverSize, base * 0.025)
  ctx.stroke()
  ctx.restore()

  const textX = coverX + coverSize + base * 0.045
  const textMaxWidth = Math.max(base * 0.24, width - textX - pad)
  const titleFit = fitTitle(ctx, data.title, textMaxWidth, Math.max(28, base * 0.05), 20)
  ctx.textBaseline = 'top'
  ctx.textAlign = 'left'
  ctx.direction = rtl ? 'rtl' : 'ltr'
  ctx.fillStyle = primary
  ctx.font = `900 ${titleFit.size}px ${fontFamily()}`
  let headerCursor = coverY + base * 0.012
  titleFit.lines.forEach((line) => {
    ctx.fillText(line, textX, headerCursor)
    headerCursor += titleFit.size * 1.16
  })

  const subtitleSize = Math.max(17, base * 0.025)
  ctx.fillStyle = secondary
  ctx.font = `600 ${subtitleSize}px ${fontFamily()}`
  ctx.fillText(data.subtitle || data.artist, textX, headerCursor + base * 0.008)

  if (options.mode === 'lyrics' && data.lines.length > 0) {
    const lyricsTop = coverY + coverSize + base * 0.085
    const lyricsBottom = height - pad * 1.9 - (options.showWatermark ? base * 0.1 : 0)
    const available = Math.max(base * 0.2, lyricsBottom - lyricsTop)
    const maxWidth = width - pad * 2
    let size = options.fontSize === 'S'
      ? Math.max(24, base * 0.038)
      : options.fontSize === 'L'
        ? Math.max(36, base * 0.062)
        : Math.max(30, base * 0.05)

    const measure = (value: number) => {
      ctx.font = `800 ${value}px ${fontFamily()}`
      return data.lines.reduce((total, line) => {
        const wrapped = wrapText(ctx, line, maxWidth)
        return total + wrapped.length * value * 1.55 + base * 0.02
      }, 0)
    }
    while (size > 18 && measure(size) > available) size -= 2

    ctx.save()
    ctx.beginPath()
    ctx.rect(pad, lyricsTop, maxWidth, available)
    ctx.clip()
    ctx.fillStyle = options.lyricsColor
    ctx.font = `800 ${size}px ${fontFamily()}`
    ctx.direction = rtl ? 'rtl' : 'ltr'
    ctx.textAlign = options.align
    const x = options.align === 'right' ? width - pad : options.align === 'left' ? pad : width / 2
    let cursor = lyricsTop
    data.lines.forEach((line) => {
      wrapText(ctx, line, maxWidth).forEach((wrapped) => {
        ctx.fillText(wrapped, x, cursor)
        cursor += size * 1.55
      })
      cursor += base * 0.02
    })
    ctx.restore()
  }

  if (options.showWatermark) drawWatermark(ctx, width, height, pad, primary, light)
  drawSticker(ctx, options.sticker, width, height, pad, light)
}

export async function renderShareCard(
  data: ShareCardData,
  options: ShareCardOptions
): Promise<{ dataUrl: string; blob: Blob }> {
  const canvas = document.createElement('canvas')
  await drawShareCard(canvas, data, options)
  const dataUrl = canvas.toDataURL('image/png')
  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((result) => {
      if (result) resolve(result)
      else reject(new Error('Canvas toBlob returned null'))
    }, 'image/png')
  })
  return { dataUrl, blob }
}
