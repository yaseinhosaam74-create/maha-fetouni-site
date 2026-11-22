import type { Song } from './firestore'

export type NativeShareSong = Pick<
  Song,
  'id' | 'titleAr' | 'titleEn' | 'artistAr' | 'artistEn' | 'coverImageUrl'
>

export type ShareLanguage = 'ar' | 'en'

const SITE_TITLE = 'مها فتوني | Maha Ftouni'
const SITE_TEXT = 'اسمعي أغاني مها فتوني - الموقع الرسمي لأغاني وصور وكلمات مها فتوني'
const SITE_URL = 'https://maha-fetouni-site.vercel.app'

type NativeShareData = ShareData & { files?: File[] }

const imageCache = new Map<string, HTMLImageElement | null>()

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

function songUrl(song: NativeShareSong): string {
  return song.id ? `${SITE_URL}/song/${encodeURIComponent(song.id)}` : SITE_URL
}

function isAbort(error: unknown): boolean {
  return error instanceof DOMException && error.name === 'AbortError'
}

async function copyLink(url: string): Promise<void> {
  if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(url)
    return
  }
  if (typeof document === 'undefined') return
  const input = document.createElement('textarea')
  input.value = url
  input.style.position = 'fixed'
  input.style.opacity = '0'
  document.body.appendChild(input)
  input.select()
  document.execCommand('copy')
  document.body.removeChild(input)
}

function showToast(message: string, success: boolean): void {
  void import('react-hot-toast').then(({ default: toast }) => {
    if (success) toast.success(message)
    else toast.error(message)
  })
}

type DesktopShareMenuData = {
  title: string
  text: string
  url: string
  blob?: Blob
  fileName?: string
  downloadUrl?: string
}

function addMenuButton(
  parent: HTMLElement,
  label: string,
  onClick: () => void,
  background = 'rgba(255,255,255,0.1)'
): HTMLButtonElement {
  const button = document.createElement('button')
  button.type = 'button'
  button.textContent = label
  button.style.cssText = `width:100%;padding:12px 16px;border:0;border-radius:12px;background:${background};color:#fff;font-weight:700;font-size:14px;cursor:pointer;text-align:center`
  button.addEventListener('click', onClick)
  parent.appendChild(button)
  return button
}

function showDesktopShareMenu(data: DesktopShareMenuData): void {
  if (typeof document === 'undefined') return
  document.querySelector('[data-native-share-menu="true"]')?.remove()

  const overlay = document.createElement('div')
  overlay.dataset.nativeShareMenu = 'true'
  overlay.setAttribute('role', 'dialog')
  overlay.setAttribute('aria-modal', 'true')
  overlay.style.cssText = 'position:fixed;inset:0;z-index:2147483647;display:flex;align-items:center;justify-content:center;background:rgba(0,0,0,0.65);backdrop-filter:blur(8px);padding:16px;direction:rtl'

  const panel = document.createElement('div')
  panel.style.cssText = 'width:min(360px,100%);max-height:90vh;overflow-y:auto;background:#1F1F1F;color:#fff;border:1px solid rgba(255,255,255,0.12);border-radius:24px;padding:20px;box-shadow:0 24px 80px rgba(0,0,0,0.6)'

  const heading = document.createElement('h2')
  heading.textContent = 'مشاركة'
  heading.style.cssText = 'margin:0 0 16px;font-size:20px;text-align:center'

  const list = document.createElement('div')
  list.style.cssText = 'display:flex;flex-direction:column;gap:10px'

  const close = () => {
    window.removeEventListener('keydown', handleKeyDown)
    document.body.style.overflow = ''
    document.documentElement.style.overflow = ''
    document.body.classList.remove('overflow-hidden')
    document.body.style.position = ''
    overlay.remove()
  }
  const handleKeyDown = (event: KeyboardEvent) => {
    if (event.key === 'Escape') close()
  }

  if (data.blob || data.downloadUrl) {
    addMenuButton(list, 'Download Image', () => {
      if (data.blob) downloadBlob(data.blob, data.fileName || 'lyrics.png')
      else if (data.downloadUrl) void downloadImageUrl(data.downloadUrl, data.fileName || 'image.png')
      close()
    }, '#7B2D2D')
  }

  const shareText = [data.text, data.url].filter(Boolean).join(' ')
  const targets = [
    { label: 'WhatsApp', href: `https://wa.me/?text=${encodeURIComponent(shareText)}` },
    { label: 'Telegram', href: `https://t.me/share/url?url=${encodeURIComponent(data.url)}&text=${encodeURIComponent(data.text)}` },
    { label: 'X', href: `https://twitter.com/intent/tweet?url=${encodeURIComponent(data.url)}&text=${encodeURIComponent(data.text)}` },
    { label: 'Facebook', href: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(data.url)}` },
  ]

  for (const target of targets) {
    const link = document.createElement('a')
    link.textContent = target.label
    link.href = target.href
    link.target = '_blank'
    link.rel = 'noopener noreferrer'
    link.style.cssText = 'display:block;width:100%;box-sizing:border-box;padding:12px 16px;border-radius:12px;background:rgba(255,255,255,0.1);color:#fff;font-weight:700;font-size:14px;text-align:center;text-decoration:none'
    link.addEventListener('click', close)
    list.appendChild(link)
  }

  addMenuButton(list, 'Copy Link', () => {
    void copyLink(data.url)
      .then(() => showToast('تم النسخ', true))
      .catch(() => showToast('تعذر النسخ', false))
    close()
  }, 'rgba(255,255,255,0.18)')

  addMenuButton(list, 'إغلاق', close, 'transparent')

  panel.appendChild(heading)
  panel.appendChild(list)
  overlay.appendChild(panel)
  overlay.addEventListener('click', (event) => {
    if (event.target === overlay) close()
  })
  document.body.appendChild(overlay)
  window.addEventListener('keydown', handleKeyDown)
}

function shareSupported(): boolean {
  const supported = typeof navigator !== 'undefined' && typeof navigator.share === 'function'
  if (!supported) console.warn('[nativeShare] navigator.share unavailable')
  return supported
}

function menuDataFromShare(data: NativeShareData, fallbackUrl: string, downloadUrl?: string): DesktopShareMenuData {
  return {
    title: typeof data.title === 'string' ? data.title : '',
    text: typeof data.text === 'string' ? data.text : '',
    url: fallbackUrl,
    downloadUrl,
  }
}

function openNativeShare(data: NativeShareData, fallbackUrl: string, downloadUrl?: string): void {
  if (!shareSupported()) {
    showDesktopShareMenu(menuDataFromShare(data, fallbackUrl, downloadUrl))
    return
  }
  try {
    const result = navigator.share!(data)
    if (result && typeof result.catch === 'function') {
      void result.catch((error: unknown) => {
        if (isAbort(error)) return
        console.warn('[nativeShare] navigator.share failed:', error)
        showDesktopShareMenu(menuDataFromShare(data, fallbackUrl, downloadUrl))
      })
    }
  } catch (error) {
    if (isAbort(error)) return
    console.warn('[nativeShare] navigator.share threw:', error)
    showDesktopShareMenu(menuDataFromShare(data, fallbackUrl, downloadUrl))
  }
}

export function shareSite(): void {
  openNativeShare(
    { title: SITE_TITLE, text: SITE_TEXT, url: SITE_URL },
    SITE_URL,
    '/icons/icon-512x512.png'
  )
}

export function shareSong(song: NativeShareSong): void {
  const title = songName(song, getLanguage())
  const url = songUrl(song)
  openNativeShare(
    { title, text: `${title} - مها فتوني`, url },
    url,
    song.coverImageUrl || undefined
  )
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

function wrapCanvasText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number, maxLines: number): string[] {
  const words = text.split(/\s+/).filter(Boolean)
  if (words.length === 0) return ['']
  const result: string[] = []
  let current = ''
  for (const word of words) {
    const candidate = current ? `${current} ${word}` : word
    if (ctx.measureText(candidate).width <= maxWidth || !current) {
      current = candidate
    } else {
      result.push(current)
      current = word
      if (result.length === maxLines) break
    }
  }
  if (result.length < maxLines && current) result.push(current)
  return result.slice(0, maxLines)
}

function paintCover(
  ctx: CanvasRenderingContext2D,
  image: HTMLImageElement,
  x: number,
  y: number,
  width: number,
  height: number
): void {
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
): void {
  const r = Math.min(radius, width / 2, height / 2)
  ctx.beginPath()
  ctx.moveTo(x + r, y)
  ctx.quadraticCurveTo(x + width, y, x + width, y + r)
  ctx.lineTo(x + width, y + height - r)
  ctx.quadraticCurveTo(x + width, y + height, x + width - r, y + height)
  ctx.lineTo(x + r, y + height)
  ctx.quadraticCurveTo(x, y + height, x, y + height - r)
  ctx.lineTo(x, y + r)
  ctx.quadraticCurveTo(x, y, x + r, y)
  ctx.closePath()
}

export async function renderLyricsImage(song: NativeShareSong, selectedLines: string[]): Promise<Blob> {
  const language = getLanguage()
  const title = songName(song, language)
  const artist = artistName(song, language)
  const [cover, logo] = await Promise.all([
    loadImage(song.coverImageUrl || ''),
    loadImage('/icons/icon-192x192.png'),
  ])

  const canvas = document.createElement('canvas')
  canvas.width = 1080
  canvas.height = 1920
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Canvas 2D unavailable')

  ctx.fillStyle = '#280B0F'
  ctx.fillRect(0, 0, canvas.width, canvas.height)
  if (cover) {
    ctx.save()
    ctx.filter = 'blur(70px)'
    paintCover(ctx, cover, -160, -160, 1400, 2240)
    ctx.restore()
  }
  ctx.fillStyle = 'rgba(0,0,0,0.62)'
  ctx.fillRect(0, 0, canvas.width, canvas.height)

  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.direction = language === 'ar' ? 'rtl' : 'ltr'
  ctx.fillStyle = '#FFFFFF'
  ctx.font = `800 48px ${fontFamily()}`
  ctx.fillText(title, 540, 150, 900)
  ctx.fillStyle = 'rgba(255,255,255,0.72)'
  ctx.font = `600 36px ${fontFamily()}`
  ctx.fillText(artist, 540, 215, 900)

  const lines = selectedLines.map((line) => line.trim()).filter(Boolean)
  const top = 460
  const bottom = 1580
  const maxWidth = 900
  let size = 78
  let layout = buildLyricLayout(ctx, lines, maxWidth, size)

  while (size > 34 && layout.height > bottom - top) {
    size -= 2
    layout = buildLyricLayout(ctx, lines, maxWidth, size)
  }

  ctx.fillStyle = '#FFFFFF'
  ctx.font = `800 ${size}px ${fontFamily()}`
  ctx.direction = language === 'ar' ? 'rtl' : 'ltr'
  let cursor = (top + bottom - layout.height) / 2 + (size * 1.45) / 2
  for (const entry of layout.entries) {
    ctx.fillText(entry.text, 540, cursor, maxWidth)
    cursor += size * 1.45 + (entry.gapAfter ? size * 0.45 : 0)
  }

  const watermarkText = SITE_TITLE
  const logoSize = 58
  const gap = 18
  const textSize = 40
  ctx.direction = 'ltr'
  ctx.textAlign = 'left'
  ctx.font = `700 ${textSize}px ${fontFamily()}`
  const textWidth = ctx.measureText(watermarkText).width
  const startX = 540 - (logoSize + gap + textWidth) / 2
  const logoY = 1790
  if (logo) {
    ctx.save()
    roundedRect(ctx, startX, logoY, logoSize, logoSize, 12)
    ctx.clip()
    ctx.drawImage(logo, startX, logoY, logoSize, logoSize)
    ctx.restore()
  }
  ctx.fillStyle = '#FFFFFF'
  ctx.fillText(watermarkText, startX + logoSize + gap, logoY + logoSize / 2)

  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob)
      else reject(new Error('Image blob failed'))
    }, 'image/png')
  })
}

function buildLyricLayout(
  ctx: CanvasRenderingContext2D,
  lines: string[],
  maxWidth: number,
  size: number
): { entries: { text: string; gapAfter: boolean }[]; height: number } {
  ctx.font = `800 ${size}px ${fontFamily()}`
  const entries: { text: string; gapAfter: boolean }[] = []
  lines.forEach((line, lineIndex) => {
    const wrapped = wrapCanvasText(ctx, line, maxWidth, 4)
    wrapped.forEach((text, wrappedIndex) => {
      entries.push({ text, gapAfter: wrappedIndex === wrapped.length - 1 && lineIndex < lines.length - 1 })
    })
  })
  const height = entries.reduce(
    (total, entry) => total + size * 1.45 + (entry.gapAfter ? size * 0.45 : 0),
    0
  )
  return { entries, height }
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

async function downloadImageUrl(url: string, fileName: string): Promise<void> {
  try {
    const response = await fetch(url)
    const blob = await response.blob()
    downloadBlob(blob, fileName)
  } catch (error) {
    console.warn('[nativeShare] download failed:', error)
    showToast('تعذر التحميل', false)
  }
}

export async function shareLyricsAsImage(song: NativeShareSong, selectedLines: string[]): Promise<void> {
  const blob = await renderLyricsImage(song, selectedLines)
  const file = new File([blob], 'lyrics.png', { type: 'image/png' })
  const title = songName(song, getLanguage())
  const text = `${title} - مها فتوني`
  const url = songUrl(song)
  const menuData: DesktopShareMenuData = { title, text, url, blob, fileName: 'lyrics.png' }

  if (!shareSupported()) {
    showDesktopShareMenu(menuData)
    return
  }

  let canShareFiles = false
  try {
    canShareFiles = typeof navigator.canShare === 'function' && navigator.canShare({ files: [file] })
  } catch (error) {
    console.warn('[nativeShare] canShare(files) failed:', error)
  }

  if (!canShareFiles) {
    console.warn('[nativeShare] File sharing unavailable; showing fallback menu')
    showDesktopShareMenu(menuData)
    return
  }

  try {
    const result = navigator.share!({ files: [file], title, text })
    if (result && typeof result.catch === 'function') {
      void result.catch((error: unknown) => {
        if (isAbort(error)) return
        console.warn('[nativeShare] navigator.share(files) failed:', error)
        showDesktopShareMenu(menuData)
      })
    }
  } catch (error) {
    if (isAbort(error)) return
    console.warn('[nativeShare] navigator.share(files) threw:', error)
    showDesktopShareMenu(menuData)
  }
}

export const shareLyrics = shareLyricsAsImage
