'use client'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import Image from 'next/image'
import { createPortal } from 'react-dom'
import {
  X, Loader2, Download, MessageCircle, Link2,
  Pencil, Send, Images, ArrowLeft,
} from 'lucide-react'
import toast from 'react-hot-toast'
import { useLanguage } from '@/app/context/LanguageContext'
import { getCoverPalette, type CoverPalette } from '@/lib/coverColors'
import { getPublishedPhotos, type Song } from '@/lib/firestore'
import {
  SHARE_WATERMARK,
  DEFAULT_SHARE_OPTIONS,
  buildShareCaption,
  buildSongShareCaption,
  drawShareCard,
  getPublicSiteOrigin,
  getPublicSongUrl,
  renderShareCard,
  type CardAlign,
  type CardBackground,
  type CardStyle,
  type FontSize,
  type ShareCardData,
  type ShareCardMode,
  type ShareCardOptions,
} from '@/lib/shareCard'

const FALLBACK_PALETTE: CoverPalette = {
  dominant: '#7B2D2D',
  palette: ['#7B2D2D', '#C6B39A', '#280B0F'],
}

const STYLES: CardStyle[] = ['classic', 'wide', 'narrow', 'slanted']
const ALIGNS: CardAlign[] = ['right', 'center', 'left']
const FONT_SIZES: FontSize[] = ['S', 'M', 'L']
type Step = 1 | 2 | 3 | 4

interface ShareSheetProps {
  currentSong: Song
  lines?: string[]
  language: 'ar' | 'en'
  initialMode?: ShareCardMode
  initialStep?: Step
  onClose: () => void
}

// Section removed (old step 2 UI)

function Choice({
  active,
  onClick,
  children,
  title,
}: {
  active: boolean
  onClick: () => void
  children: React.ReactNode
  title?: string
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      aria-pressed={active}
      className={`px-3 py-2 rounded-xl text-xs font-bold border transition ${
        active
          ? 'bg-white text-black border-white'
          : 'bg-white/10 text-white/70 border-white/15 hover:bg-white/15'
      }`}
    >
      {children}
    </button>
  )
}

export default function ShareSheet({
  currentSong,
  lines,
  language,
  initialMode = 'lyrics',
  initialStep = 1,
  onClose,
}: ShareSheetProps) {
  const { t } = useLanguage()
  const [step, setStep] = useState<Step>(initialStep)
  const [mode, setMode] = useState<ShareCardMode>(initialMode)
  const [style, setStyle] = useState<CardStyle>(DEFAULT_SHARE_OPTIONS.style)
  const [background, setBackground] = useState<CardBackground>('gradient')
  const [backgroundUrl, setBackgroundUrl] = useState(currentSong.coverImageUrl)
  const [artistImages, setArtistImages] = useState<string[]>([currentSong.coverImageUrl, currentSong.coverImageUrl])
  const [align, setAlign] = useState<CardAlign>(DEFAULT_SHARE_OPTIONS.align)
  const [fontSize, setFontSize] = useState<FontSize>(DEFAULT_SHARE_OPTIONS.fontSize)
  const [lyricsColor, setLyricsColor] = useState(DEFAULT_SHARE_OPTIONS.lyricsColor)
  const showWatermark = DEFAULT_SHARE_OPTIONS.showWatermark
  const sticker = DEFAULT_SHARE_OPTIONS.sticker
  const [palette, setPalette] = useState<CoverPalette>(FALLBACK_PALETTE)
  const MAX_SHARE_LINES = 5
  const [selectedLines, setSelectedLines] = useState<number[]>([])
  const [isEditing, setIsEditing] = useState(false)
  const [editedText, setEditedText] = useState('')
  const [busyAction, setBusyAction] = useState('')
  const [editOpen, setEditOpen] = useState(false)
  const [editTab, setEditTab] = useState<'color' | 'text' | 'images'>('color')
  const [, setGalleryImages] = useState<string[]>([])
  const [isMounted, setIsMounted] = useState(false)
  const [isPreviewReady, setIsPreviewReady] = useState(false)
  const previewRef = useRef<HTMLCanvasElement>(null)
  const sheetRef = useRef<HTMLDivElement>(null)
  const closeRef = useRef<HTMLButtonElement>(null)
  const onCloseRef = useRef(onClose)
  const bodyOverflowRef = useRef('')
  const htmlOverflowRef = useRef('')
  const previousFocusRef = useRef<HTMLElement | null>(null)

  useEffect(() => { onCloseRef.current = onClose }, [onClose])
  useEffect(() => { setIsMounted(true) }, [])

  const lyricSource = useMemo(() => {
    if (lines && lines.length > 0) return lines
    const stored = language === 'ar'
      ? currentSong.lyricsAr || currentSong.lyricsEn
      : currentSong.lyricsEn || currentSong.lyricsAr
    return stored ? stored.split(/\r\n|[\n\r]/) : []
  }, [lines, language, currentSong.lyricsAr, currentSong.lyricsEn])

  const uniqueLines = useMemo(
    () => Array.from(new Set(lyricSource.map((line) => line.trim()).filter(Boolean))),
    [lyricSource]
  )

  useEffect(() => {
    setSelectedLines([])
    setBackgroundUrl(currentSong.coverImageUrl)
    setEditedText('')
    setIsEditing(false)
    setStep(initialStep)
    setMode(initialMode)
  }, [currentSong.id, currentSong.coverImageUrl, initialMode, initialStep])

  useEffect(() => {
    let cancelled = false
    void getCoverPalette(currentSong.coverImageUrl).then((value) => {
      if (!cancelled) setPalette(value)
    })
    return () => { cancelled = true }
  }, [currentSong.coverImageUrl])

  useEffect(() => {
    let cancelled = false
    void getPublishedPhotos()
      .then((photos) => {
        const urls = photos.filter((photo) => photo.isPublished && photo.imageUrl).map((photo) => photo.imageUrl)
        if (cancelled) return
        setGalleryImages(urls)
        const shuffled = [...urls].sort(() => Math.random() - 0.5).slice(0, 5)
        setArtistImages([currentSong.coverImageUrl, ...shuffled])
      })
      .catch(() => undefined)
    return () => { cancelled = true }
  }, [currentSong.id, currentSong.coverImageUrl, editOpen])

  const selectedTexts = useMemo(
    () => selectedLines.map((index) => uniqueLines[index]).filter((line): line is string => Boolean(line)),
    [selectedLines, uniqueLines]
  )
  const editedTexts = useMemo(
    () => Array.from(new Set(editedText.split(/\r\n|[\n\r]/).map((line) => line.trim()).filter(Boolean))),
    [editedText]
  )
  const cardLines = isEditing ? editedTexts : selectedTexts
  const title = language === 'ar' ? currentSong.titleAr || currentSong.titleEn : currentSong.titleEn || currentSong.titleAr
  const artist = language === 'ar' ? currentSong.artistAr || 'مهى فتوني' : currentSong.artistEn || 'Maha Ftouni'
  const shareArtist = currentSong.artistEn || currentSong.artistAr || 'Maha Ftouni'
  const subtitle = `${t('songLabel')} · ${artist}`

  const options = useMemo<ShareCardOptions>(
    () => ({ mode, style, background, align, fontSize, lyricsColor, showWatermark, sticker }),
    [mode, style, background, align, fontSize, lyricsColor, showWatermark, sticker]
  )
  const cardData = useMemo<ShareCardData>(
    () => ({
      coverUrl: currentSong.coverImageUrl,
      backgroundUrl,
      palette,
      lines: cardLines,
      title,
      subtitle,
      artist,
      language,
    }),
    [currentSong.coverImageUrl, backgroundUrl, palette, cardLines, title, subtitle, artist, language]
  )
  const siteOrigin = useMemo(() => getPublicSiteOrigin(), [])
  const publicLink = useMemo(() => getPublicSongUrl(currentSong.id), [currentSong.id])
  const songPageUrl = useMemo(() => {
    if (currentSong.id) return publicLink
    return siteOrigin
  }, [currentSong.id, publicLink, siteOrigin])
  const caption = useMemo(
    () => mode === 'song'
      ? buildSongShareCaption({ title, artist: shareArtist }, publicLink)
      : buildShareCaption({ title, artist: shareArtist, lines: cardLines }),
    [mode, title, shareArtist, publicLink, cardLines]
  )

  const reportError = useCallback((action: string, error: unknown) => {
    const message = error instanceof Error ? error.message : String(error)
    console.error(`[ShareSheet] ${action} failed:`, error)
    toast.error(`${t('shareFailed')}: ${message}`)
  }, [t])

  useEffect(() => {
    if (step < 2) {
      setIsPreviewReady(false)
      return
    }
    const canvas = previewRef.current
    if (!canvas) return
    let cancelled = false
    setIsPreviewReady(false)
    void drawShareCard(canvas, cardData, options).then(() => {
      if (!cancelled) setIsPreviewReady(true)
    }).catch((error) => {
      if (!cancelled) reportError('preview', error)
    })
    return () => { cancelled = true }
  }, [cardData, options, step, reportError])

  useEffect(() => {
    if (!isMounted) return
    bodyOverflowRef.current = document.body.style.overflow
    htmlOverflowRef.current = document.documentElement.style.overflow
    previousFocusRef.current = document.activeElement as HTMLElement | null
    document.body.style.overflow = 'hidden'
    document.documentElement.style.overflow = 'hidden'
    closeRef.current?.focus()

    const closeSheet = () => {
      document.body.style.overflow = bodyOverflowRef.current
      document.documentElement.style.overflow = htmlOverflowRef.current
      onCloseRef.current()
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault()
        closeSheet()
        return
      }
      if (event.key !== 'Tab') return
      const focusables = Array.from(
        sheetRef.current?.querySelectorAll<HTMLElement>(
          'button:not([disabled]), [href], input, textarea, select, [tabindex]:not([tabindex="-1"])'
        ) ?? []
      ).filter((element) => element.offsetParent !== null)
      if (focusables.length === 0) return
      const first = focusables[0]
      const last = focusables[focusables.length - 1]
      const active = document.activeElement
      if (!sheetRef.current?.contains(active)) {
        event.preventDefault()
        first.focus()
      } else if (event.shiftKey && active === first) {
        event.preventDefault()
        last.focus()
      } else if (!event.shiftKey && active === last) {
        event.preventDefault()
        first.focus()
      }
    }
    window.addEventListener('keydown', handleKeyDown, true)
    return () => {
      window.removeEventListener('keydown', handleKeyDown, true)
      document.body.style.overflow = bodyOverflowRef.current
      document.documentElement.style.overflow = htmlOverflowRef.current
      const target = previousFocusRef.current
      if (target?.isConnected) target.focus()
      else document.body.focus()
    }
  }, [isMounted])

  const toggleLine = (index: number) => {
    const isSelected = selectedLines.includes(index)
    if (isSelected) {
      setSelectedLines((previous) => previous.filter((item) => item !== index))
      return
    }
    if (selectedLines.length >= MAX_SHARE_LINES) {
      toast.error(t('maxLines'))
      return
    }
    setSelectedLines((previous) => [...previous, index].sort((a, b) => a - b))
  }

  const downloadPng = (dataUrl: string) => {
    const link = document.createElement('a')
    link.href = dataUrl
    link.download = `${SHARE_WATERMARK}-${title.replace(/[^\w\u0600-\u06FF-]+/g, '-')}.png`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const copyValue = async (value: string) => {
    if (!navigator.clipboard?.writeText) throw new Error(t('clipboardUnsupported'))
    await navigator.clipboard.writeText(value)
  }

  const canvasExport = (canvas: HTMLCanvasElement): Promise<{ dataUrl: string; blob: Blob }> =>
    new Promise((resolve, reject) => {
      canvas.toBlob((blob) => {
        if (blob) resolve({ dataUrl: canvas.toDataURL('image/png'), blob })
        else reject(new Error('Canvas toBlob returned null'))
      }, 'image/png')
    })

  const withExport = async (
    action: string,
    handler: (result: { dataUrl: string; blob: Blob }) => Promise<void> | void
  ) => {
    if (mode === 'lyrics' && cardLines.length === 0) {
      toast.error(t('selectAtLeastOne'))
      return
    }
    setBusyAction(action)
    try {
      const result = isPreviewReady && previewRef.current
        ? await canvasExport(previewRef.current)
        : await renderShareCard(cardData, options)
      await handler(result)
    } catch (error) {
      reportError(action, error)
    } finally {
      setBusyAction('')
    }
  }

  const handleDownload = () => {
    void withExport('download', ({ dataUrl }) => {
      downloadPng(dataUrl)
      toast.success(t('imageSaved'))
    })
  }
  const downloadPngFromCurrent = () => { void withExport('download', ({ dataUrl }) => downloadPng(dataUrl)) }

  const handleCopyLink = async () => {
    try {
      await copyValue(songPageUrl || caption)
      toast.success(t('copiedLink'))
    } catch (error) {
      reportError('link', error)
    }
  }

  const handleWhatsapp = () => {
    void withExport('whatsapp', async ({ dataUrl }) => {
      downloadPng(dataUrl)
      window.open(`https://wa.me/?text=${encodeURIComponent(caption)}`, '_blank', 'noopener,noreferrer')
    })
  }

  const handleSms = () => {
    window.location.href = `sms:?body=${encodeURIComponent(songPageUrl || caption)}`
  }

  const handleStory = () => {
    void withExport('story', async ({ dataUrl }) => {
      downloadPng(dataUrl)
      toast.success(t('uploadInstruction'))
    })
  }

  const startEditing = () => {
    setEditedText(selectedTexts.join('\n'))
    setIsEditing(true)
    setEditTab('color')
    setEditOpen(true)
  }

  const busyIcon = (action: string, fallback: React.ReactNode) =>
    busyAction === action ? <Loader2 className="animate-spin" size={16} /> : fallback
  const busy = Boolean(busyAction) || (step >= 2 && !isPreviewReady)
  const stepTitle = step === 1 ? t('selectLyrics') : step === 2 ? t('customizeCard') : step === 3 ? t('shareSong') : t('share')
  // shareActionClass removed in Step 6 redesign

  // stickerIcon removed

  if (!isMounted) return null

  const gradientBg = `linear-gradient(180deg, ${palette.dominant} 0%, ${palette.palette[1] ?? palette.dominant} 55%, ${palette.palette[2] ?? palette.dominant} 100%)`
  const bgStyle = step === 1
    ? { background: gradientBg }
    : { background: 'rgba(0,0,0,0.28)', backdropFilter: 'blur(18px)', WebkitBackdropFilter: 'blur(18px)' }

  return createPortal(
    <div
      ref={sheetRef}
      onClick={onClose}
      className="fixed inset-0 z-[200] flex flex-col text-white"
      style={bgStyle}
      dir={language === 'ar' ? 'rtl' : 'ltr'}
    >
      <div
        onClick={(event) => event.stopPropagation()}
        className="min-h-0 flex-1 overflow-y-auto overscroll-contain"
      >
        <div className="mx-auto w-full max-w-3xl px-4 pt-6 pb-[120px]">
        <header className={`relative mb-6 ${step === 1 ? 'pt-2 pb-2' : 'flex items-start justify-between gap-4'}`}>
          {step === 1 ? (
            <>
              <button
                ref={closeRef}
                onClick={onClose}
                className="absolute left-0 top-1 w-11 h-11 rounded-full flex items-center justify-center text-white/80 hover:text-white"
                title={t('close')}
                aria-label={t('close')}
              >
                <ArrowLeft size={28} />
              </button>
              <div className="text-center px-12">
                <h2 className="text-4xl font-black tracking-tight">{t('selectLyrics')}</h2>
                <p className="text-sm text-white/55 mt-2">
                  {selectedLines.length >= MAX_SHARE_LINES ? t('maxLines') : `${selectedLines.length} ${language === 'ar' ? 'سطور محددة' : 'lines selected'}`}
                </p>
              </div>
            </>
          ) : (
            <>
              <div>
                <h2 className="text-2xl font-black">{stepTitle}</h2>
                <p className="text-sm text-white/50 mt-1">{title} · {shareArtist}</p>
              </div>
              <button
                ref={closeRef}
                onClick={onClose}
                className="w-11 h-11 shrink-0 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center"
                title={t('close')}
                aria-label={t('close')}
              >
                <X size={23} />
              </button>
            </>
          )}
        </header>

        {step === 1 && (
          <div className="pb-[120px]">
            <div className="flex flex-col items-center gap-7 py-4">
              {uniqueLines.map((line, index) => {
                const isSelected = selectedLines.includes(index)
                return (
                  <button
                    key={`${index}-${line}`}
                    type="button"
                    onClick={() => toggleLine(index)}
                    className={`w-full text-center text-[2rem] leading-tight font-black tracking-tight transition-colors ${
                      isSelected ? 'text-white' : 'text-white/35 hover:text-white/55'
                    }`}
                  >
                    {line}
                  </button>
                )
              })}
            </div>
          </div>
        )}

        {step >= 2 && (
          <div className="flex justify-center rounded-3xl p-2" style={{ background: `${palette.dominant}22` }}>
            <canvas
              ref={previewRef}
              className="rounded-2xl shadow-2xl"
              style={{ width: 'auto', maxWidth: '100%', maxHeight: 'min(52vh, 580px)' }}
            />
          </div>
        )}

        {editOpen && (
          <div className="fixed inset-x-0 bottom-0 z-[220] px-3 pb-3" onClick={(e) => e.stopPropagation()}>
            <div className="mx-auto max-w-3xl rounded-3xl bg-zinc-900/95 border border-white/10 p-4 space-y-4 backdrop-blur-xl">
              <div className="flex gap-2 bg-white/10 p-1 rounded-xl w-fit mx-auto">
                {(['color', 'text', 'images'] as const).map((tab) => (
                  <button key={tab} type="button" onClick={() => setEditTab(tab)} className={`px-4 py-2 rounded-lg text-sm font-bold ${editTab === tab ? 'bg-white text-black' : 'text-white/70'}`}>
                    {tab === 'color' ? (language === 'ar' ? 'اللون' : 'Color') : tab === 'text' ? (language === 'ar' ? 'النص' : 'Text') : (language === 'ar' ? 'الصور' : 'Images')}
                  </button>
                ))}
              </div>

              {editTab === 'color' && (
                <div className="flex flex-wrap gap-3 justify-center">
                  {Array.from(new Set([palette.dominant, ...palette.palette, '#FFFFFF', '#000000'])).map((color) => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => { setBackground('gradient'); setLyricsColor('#FFFFFF'); setPalette((p) => ({ ...p, dominant: color, palette: [color, p.palette[1] || color, p.palette[2] || color] })) }}
                      className={`w-11 h-11 rounded-full border-2 ${palette.dominant.toLowerCase() === color.toLowerCase() && background === 'gradient' ? 'border-white scale-110' : 'border-white/20'}`}
                      style={{ backgroundColor: color }}
                      aria-label={color}
                    />
                  ))}
                </div>
              )}

              {editTab === 'text' && (
                <div className="space-y-4">
                  <div className="flex flex-wrap gap-2 justify-center">
                    {STYLES.map((value) => (
                      <Choice key={value} active={style === value} onClick={() => setStyle(value)}>
                        {t(`style_${value}`)}
                      </Choice>
                    ))}
                  </div>
                  <div className="flex flex-wrap gap-2 justify-center">
                    {ALIGNS.map((value) => (
                      <Choice key={value} active={align === value} onClick={() => setAlign(value)}>
                        {t(`align${value.charAt(0).toUpperCase()}${value.slice(1)}`)}
                      </Choice>
                    ))}
                    {FONT_SIZES.map((value) => (
                      <Choice key={value} active={fontSize === value} onClick={() => setFontSize(value)}>
                        <span className={value === 'S' ? 'text-xs' : value === 'M' ? 'text-base' : 'text-xl'}>a</span>
                      </Choice>
                    ))}
                  </div>
                </div>
              )}

              {editTab === 'images' && (
                <div className="flex flex-wrap gap-3 justify-center">
                  {artistImages.map((url, index) => (
                    <button
                      key={`${url}-${index}`}
                      type="button"
                      onClick={() => { setBackground('cover'); setBackgroundUrl(url) }}
                      className={`relative w-16 h-16 rounded-xl overflow-hidden border-2 ${background === 'cover' && backgroundUrl === url ? 'border-white scale-105' : 'border-white/20'}`}
                    >
                      <Image src={url} alt="" fill unoptimized sizes="64px" className="object-cover" />
                    </button>
                  ))}
                </div>
              )}

              <button type="button" onClick={() => setEditOpen(false)} className="w-full rounded-full bg-white text-black py-3 font-black">
                {language === 'ar' ? 'تم' : 'Done'}
              </button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="mt-6 space-y-4 flex flex-col items-center">
            <div className="flex gap-2 bg-white/10 p-1 rounded-xl w-fit">
              <span className="px-4 py-2 rounded-lg text-sm font-bold bg-white/15 text-white">{language === 'ar' ? 'كلمات' : 'Lyrics'}</span>
            </div>
            <button
              type="button"
              onClick={startEditing}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/10 text-white text-xs font-bold hover:bg-white/15"
            >
              <Pencil size={15} /> {t('editLyrics')}
            </button>
          </div>
        )}
        </div>
      </div>

      <div
        onClick={(event) => event.stopPropagation()}
        className="fixed inset-x-0 bottom-0 z-50 border-t border-white/10 bg-black/95 px-4 pt-3 backdrop-blur-xl"
        style={{ paddingBottom: 'calc(16px + env(safe-area-inset-bottom))' }}
      >
        <div className="mx-auto w-full max-w-3xl space-y-3">
          {step === 1 && (
            <button
              type="button"
              onClick={() => { setMode('lyrics'); setStep(3) }}
              disabled={selectedLines.length === 0}
              className={`w-full rounded-full py-4 text-lg font-black transition ${
                selectedLines.length === 0
                  ? 'bg-white/20 text-white/45 cursor-not-allowed'
                  : 'bg-white/90 text-black hover:bg-white'
              }`}
            >
              {t('continue')}
            </button>
          )}

          {step === 2 && (
            <button
              type="button"
              onClick={() => setStep(3)}
              className="w-full rounded-full bg-white py-3.5 text-sm font-black text-black transition hover:bg-white/90"
            >
              {t('done')}
            </button>
          )}

          {step === 3 && (
            <button
              type="button"
              onClick={() => setStep(4)}
              disabled={busy}
              className="w-full rounded-full bg-white py-3.5 text-sm font-black text-black transition hover:bg-white/90 disabled:opacity-40"
            >
              {t('share')}
            </button>
          )}

          {step === 4 && (
            <>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setStep(3)}
                  className="flex flex-1 items-center justify-center gap-2 rounded-full bg-white/10 px-4 py-2.5 text-xs font-bold text-white transition hover:bg-white/15"
                >
                  <ArrowLeft size={15} /> {t('back')}
                </button>
                <button
                  type="button"
                  onClick={handleDownload}
                  disabled={busy}
                  className="flex flex-1 items-center justify-center gap-2 rounded-full bg-white/10 px-4 py-2.5 text-xs font-bold text-white transition hover:bg-white/15 disabled:opacity-40"
                >
                  {busyIcon('download', <Download size={15} />)} {t('downloadPng')}
                </button>
              </div>
              <div className="flex gap-4 overflow-x-auto pb-1 justify-start sm:justify-center" dir="ltr">
                {[
                  { key: 'whatsapp', label: 'WhatsApp', icon: <MessageCircle size={22} />, bg: 'bg-[#25D366]', onClick: handleWhatsapp },
                  { key: 'instagram', label: 'Instagram', icon: <Images size={22} />, bg: 'bg-gradient-to-br from-fuchsia-500 via-red-500 to-orange-400', onClick: handleStory },
                  { key: 'tiktok', label: 'TikTok', icon: <span className="font-black text-lg">♪</span>, bg: 'bg-black border border-white/20', onClick: handleStory },
                  { key: 'snapchat', label: 'Snapchat', icon: <span className="font-black text-lg">👻</span>, bg: 'bg-[#FFFC00] text-black', onClick: handleStory },
                  { key: 'facebook', label: 'Facebook', icon: <span className="font-black text-xl">f</span>, bg: 'bg-[#1877F2]', onClick: () => { downloadPngFromCurrent(); window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(songPageUrl)}`, '_blank', 'noopener,noreferrer') } },
                  { key: 'telegram', label: 'Telegram', icon: <Send size={22} />, bg: 'bg-[#229ED9]', onClick: () => window.open(`https://t.me/share/url?url=${encodeURIComponent(songPageUrl)}&text=${encodeURIComponent(caption)}`, '_blank', 'noopener,noreferrer') },
                  { key: 'x', label: 'X', icon: <span className="font-black text-lg">X</span>, bg: 'bg-black border border-white/20', onClick: () => window.open(`https://twitter.com/intent/tweet?url=${encodeURIComponent(songPageUrl)}&text=${encodeURIComponent(caption)}`, '_blank', 'noopener,noreferrer') },
                  { key: 'sms', label: 'SMS', icon: <Send size={22} />, bg: 'bg-[#34C759]', onClick: handleSms },
                  { key: 'copy', label: t('copyLink'), icon: <Link2 size={22} />, bg: 'bg-white/20', onClick: () => void handleCopyLink() },
                  { key: 'download', label: t('downloadPng'), icon: busyIcon('download', <Download size={22} />), bg: 'bg-white/20', onClick: handleDownload },
                ].map((item) => (
                  <button key={item.key} type="button" onClick={item.onClick} disabled={busy && item.key !== 'copy' && item.key !== 'sms' && item.key !== 'x' && item.key !== 'telegram'} className="flex flex-col items-center gap-2 text-[11px] text-white/80 min-w-[64px] disabled:opacity-40">
                    <span className={`w-14 h-14 rounded-full text-white flex items-center justify-center ${item.bg}`}>{item.icon}</span>
                    {item.label}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>,
    document.body
  )
}
