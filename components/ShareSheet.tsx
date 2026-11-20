'use client'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import Image from 'next/image'
import { createPortal } from 'react-dom'
import {
  X, Loader2, Download, Check, MessageCircle, Link2,
  Pencil, Send, Smartphone, Images, ArrowLeft,
  Heart, Star, Sparkles,
} from 'lucide-react'
import toast from 'react-hot-toast'
import { useLanguage } from '@/app/context/LanguageContext'
import { getCoverPalette, type CoverPalette } from '@/lib/coverColors'
import { getPublishedPhotos, type Song } from '@/lib/firestore'
import {
  SHARE_WATERMARK,
  CARD_STYLES,
  DEFAULT_SHARE_OPTIONS,
  buildShareCaption,
  buildSongShareCaption,
  drawShareCard,
  getPublicSongUrl,
  renderShareCard,
  type CardAlign,
  type CardBackground,
  type CardStyle,
  type FontSize,
  type ShareCardData,
  type ShareCardMode,
  type ShareCardOptions,
  type Sticker,
} from '@/lib/shareCard'

const FALLBACK_PALETTE: CoverPalette = {
  dominant: '#7B2D2D',
  palette: ['#7B2D2D', '#C6B39A', '#280B0F'],
}

const STYLES: CardStyle[] = ['classic', 'wide', 'narrow', 'slanted']
const BACKGROUNDS: CardBackground[] = ['black', 'darkGrey', 'lightGrey', 'white', 'gradient', 'cover']
const COLOR_PRESETS = ['#FFFFFF', '#000000', '#E11D2A', '#FACC15']
const ALIGNS: CardAlign[] = ['right', 'center', 'left']
const FONT_SIZES: FontSize[] = ['S', 'M', 'L']
const STICKERS: Sticker[] = ['none', 'heart', 'star', 'sparkle']
type Step = 1 | 2 | 3 | 4

interface ShareSheetProps {
  currentSong: Song
  lines?: string[]
  language: 'ar' | 'en'
  initialMode?: ShareCardMode
  onClose: () => void
}

function Section({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2 min-w-[190px] flex-1">
      <p className="text-[11px] font-bold uppercase tracking-wider text-white/45">{label}</p>
      <div className="flex flex-wrap gap-2">{children}</div>
    </div>
  )
}

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
  onClose,
}: ShareSheetProps) {
  const { t } = useLanguage()
  const [step, setStep] = useState<Step>(1)
  const [mode, setMode] = useState<ShareCardMode>(initialMode)
  const [style, setStyle] = useState<CardStyle>(DEFAULT_SHARE_OPTIONS.style)
  const [background, setBackground] = useState<CardBackground>(DEFAULT_SHARE_OPTIONS.background)
  const [backgroundUrl, setBackgroundUrl] = useState(currentSong.coverImageUrl)
  const [artistImages, setArtistImages] = useState<string[]>([currentSong.coverImageUrl, currentSong.coverImageUrl])
  const [align, setAlign] = useState<CardAlign>(DEFAULT_SHARE_OPTIONS.align)
  const [fontSize, setFontSize] = useState<FontSize>(DEFAULT_SHARE_OPTIONS.fontSize)
  const [lyricsColor, setLyricsColor] = useState(DEFAULT_SHARE_OPTIONS.lyricsColor)
  const showWatermark = DEFAULT_SHARE_OPTIONS.showWatermark
  const [sticker, setSticker] = useState<Sticker>(DEFAULT_SHARE_OPTIONS.sticker)
  const [palette, setPalette] = useState<CoverPalette>(FALLBACK_PALETTE)
  const [selectedLines, setSelectedLines] = useState<number[]>(() =>
    Array.from(new Set((lines ?? []).map((line) => line.trim()).filter(Boolean)))
      .slice(0, 4)
      .map((_, index) => index)
  )
  const [isEditing, setIsEditing] = useState(false)
  const [editedText, setEditedText] = useState('')
  const [busyAction, setBusyAction] = useState('')
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
    setSelectedLines(uniqueLines.slice(0, 4).map((_, index) => index))
    setBackgroundUrl(currentSong.coverImageUrl)
    setEditedText('')
    setIsEditing(false)
    setStep(1)
    setMode(initialMode)
  }, [currentSong.id, currentSong.coverImageUrl, uniqueLines, initialMode])

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
        const urls = photos.filter((photo) => photo.isPublished && photo.imageUrl).slice(0, 2).map((photo) => photo.imageUrl)
        if (!cancelled) {
          setArtistImages([currentSong.coverImageUrl, urls[0] ?? currentSong.coverImageUrl])
        }
      })
      .catch(() => undefined)
    return () => { cancelled = true }
  }, [currentSong.id, currentSong.coverImageUrl])

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
  const publicLink = useMemo(() => getPublicSongUrl(currentSong.id), [currentSong.id])
  const songPageUrl = useMemo(
    () => publicLink || (typeof window === 'undefined' ? '' : `${window.location.origin}/songs/${currentSong.id}`),
    [publicLink, currentSong.id]
  )
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

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onCloseRef.current()
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
    if (isSelected && selectedLines.length === 1) {
      toast.error(t('selectAtLeastOne'))
      return
    }
    if (!isSelected && selectedLines.length >= 4) {
      toast.error(t('maxLines'))
      return
    }
    setSelectedLines((previous) =>
      previous.includes(index)
        ? previous.filter((item) => item !== index)
        : [...previous, index].sort((a, b) => a - b)
    )
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

  const nativeImageShare = async (blob: Blob): Promise<'shared' | 'unsupported'> => {
    if (!navigator.share || typeof navigator.canShare !== 'function') return 'unsupported'
    const file = new File([blob], `${SHARE_WATERMARK}.png`, { type: 'image/png' })
    try {
      if (!navigator.canShare({ files: [file] })) return 'unsupported'
      await navigator.share({ files: [file], title, text: caption })
      return 'shared'
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') return 'shared'
      return 'unsupported'
    }
  }

  const handleDownload = () => {
    void withExport('download', ({ dataUrl }) => {
      downloadPng(dataUrl)
      toast.success(t('imageSaved'))
    })
  }

  const handleCopyLink = async () => {
    try {
      await copyValue(songPageUrl || caption)
      toast.success(t('copiedLink'))
    } catch (error) {
      reportError('link', error)
    }
  }

  const handleWhatsapp = () => {
    window.open(`https://wa.me/?text=${encodeURIComponent(songPageUrl || caption)}`, '_blank', 'noopener,noreferrer')
  }

  const handleSms = () => {
    window.location.href = `sms:?body=${encodeURIComponent(songPageUrl || caption)}`
  }

  const handleStory = () => {
    void withExport('story', async ({ dataUrl, blob }) => {
      downloadPng(dataUrl)
      const result = await nativeImageShare(blob)
      if (result === 'unsupported') toast.success(t('uploadInstruction'))
    })
  }

  const startEditing = () => {
    setEditedText(selectedTexts.join('\n'))
    setIsEditing(true)
    setStep(2)
  }

  const busyIcon = (action: string, fallback: React.ReactNode) =>
    busyAction === action ? <Loader2 className="animate-spin" size={16} /> : fallback
  const busy = Boolean(busyAction) || (step >= 2 && !isPreviewReady)
  const stepTitle = step === 1 ? t('selectLyrics') : step === 2 ? t('customizeCard') : step === 3 ? t('shareSong') : t('share')
  const shareActionClass =
    'flex shrink-0 items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold whitespace-nowrap border border-white/10 bg-white/10 text-white transition hover:bg-white/20 disabled:opacity-40'

  const stickerIcon = (value: Sticker) => {
    if (value === 'heart') return <Heart size={15} />
    if (value === 'star') return <Star size={15} />
    if (value === 'sparkle') return <Sparkles size={15} />
    return <X size={15} />
  }

  if (!isMounted) return null

  return createPortal(
    <div
      ref={sheetRef}
      onClick={onClose}
      className="fixed inset-0 z-[200] flex flex-col bg-black/95 backdrop-blur-xl text-white"
      dir={language === 'ar' ? 'rtl' : 'ltr'}
    >
      <div
        onClick={(event) => event.stopPropagation()}
        className="min-h-0 flex-1 overflow-y-auto overscroll-contain"
      >
        <div className="mx-auto w-full max-w-3xl px-4 pt-6 pb-[120px]">
        <header className="flex items-start justify-between gap-4 mb-6">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-rubine mb-1">
              {t('step')} {step}/4
            </p>
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
        </header>

        {step === 1 && (
          <div className="space-y-5">
            <div className="flex items-center justify-between gap-3">
              <h3 className="text-lg font-black">{t('selectLyrics')}</h3>
              <span className="text-xs font-bold text-white/55">{selectedLines.length}/4 {t('linesSelected')}</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pb-[120px]">
              {uniqueLines.slice(0, 24).map((line, index) => {
                const isSelected = selectedLines.includes(index)
                return (
                  <button
                    key={`${index}-${line}`}
                    type="button"
                    onClick={() => toggleLine(index)}
                    className={`flex items-center gap-3 rounded-2xl px-4 py-3 text-start text-sm font-bold transition ${
                      isSelected ? 'bg-white text-black shadow-lg' : 'bg-white/10 text-white/65 hover:bg-white/15'
                    }`}
                  >
                    <span className={`w-6 h-6 shrink-0 rounded-full flex items-center justify-center text-[11px] ${
                      isSelected ? 'bg-black text-white' : 'bg-white/10 text-white/60'
                    }`}>
                      {isSelected ? <Check size={13} /> : index + 1}
                    </span>
                    <span className="line-clamp-2">{line}</span>
                  </button>
                )
              })}
            </div>
          </div>
        )}

        {step >= 2 && (
          <div className="flex justify-center rounded-2xl border border-white/10 bg-black/60 p-3">
            <canvas
              ref={previewRef}
              className="rounded-lg shadow-2xl"
              style={{ width: 'auto', maxWidth: '100%', maxHeight: 'min(52vh, 580px)' }}
            />
          </div>
        )}

        {step === 2 && (
          <div className="mt-6 space-y-6">
            <div className="flex flex-wrap items-center gap-2">
              <p className="w-full text-[11px] font-bold uppercase tracking-wider text-white/45">{t('layout')}</p>
              {STYLES.map((value) => (
                <Choice key={value} active={style === value} onClick={() => setStyle(value)}>
                  {t(`style_${value}`)} <span className="opacity-55">({CARD_STYLES[value].label})</span>
                </Choice>
              ))}
            </div>

            <div className="flex flex-wrap gap-5">
              <Section label={t('lyricsColor')}>
                {COLOR_PRESETS.map((color) => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => setLyricsColor(color)}
                    aria-label={color}
                    aria-pressed={lyricsColor.toLowerCase() === color.toLowerCase()}
                    className={`w-9 h-9 rounded-full border-2 transition ${
                      lyricsColor.toLowerCase() === color.toLowerCase() ? 'border-white scale-110' : 'border-white/25'
                    }`}
                    style={{ backgroundColor: color }}
                  />
                ))}
              </Section>

              <Section label={t('images')}>
                {artistImages.map((url, index) => (
                  <button
                    key={`${url}-${index}`}
                    type="button"
                    onClick={() => setBackgroundUrl(url)}
                    aria-label={`${t('images')} ${index + 1}`}
                    aria-pressed={backgroundUrl === url}
                    className={`relative w-14 h-14 rounded-xl overflow-hidden border-2 transition ${
                      backgroundUrl === url ? 'border-white scale-105' : 'border-white/20'
                    }`}
                  >
                    <Image src={url} alt="" fill unoptimized sizes="56px" className="object-cover" />
                  </button>
                ))}
              </Section>

              <Section label={t('alignment')}>
                {ALIGNS.map((value) => (
                  <Choice key={value} active={align === value} onClick={() => setAlign(value)}>
                    {t(`align${value.charAt(0).toUpperCase()}${value.slice(1)}`)}
                  </Choice>
                ))}
              </Section>

              <Section label={t('fontSize')}>
                {FONT_SIZES.map((value) => (
                  <Choice key={value} active={fontSize === value} onClick={() => setFontSize(value)}>
                    <span className={value === 'S' ? 'text-xs' : value === 'M' ? 'text-base' : 'text-xl'}>a</span>
                  </Choice>
                ))}
              </Section>

              <Section label={t('stickers')}>
                {STICKERS.map((value) => (
                  <Choice key={value} active={sticker === value} onClick={() => setSticker(value)} title={t(`sticker_${value}`)}>
                    {stickerIcon(value)}
                  </Choice>
                ))}
              </Section>

              <Section label={t('background')}>
                {BACKGROUNDS.map((value) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setBackground(value)}
                    aria-label={t(`bg_${value}`)}
                    aria-pressed={background === value}
                    className={`w-10 h-10 rounded-lg border-2 transition ${
                      background === value ? 'border-white scale-105' : 'border-white/20'
                    }`}
                    style={{
                      background:
                        value === 'cover'
                          ? `center / cover no-repeat url("${backgroundUrl}")`
                          : value === 'gradient'
                            ? `linear-gradient(135deg, ${palette.palette.join(', ')})`
                            : value === 'white'
                              ? '#FFFFFF'
                              : value === 'lightGrey'
                                ? '#D9D9D9'
                                : value === 'darkGrey'
                                  ? '#1F1F1F'
                                  : '#000000',
                    }}
                  />
                ))}
              </Section>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="mt-6 space-y-4">
            <div className="flex gap-2 bg-white/5 p-1 rounded-xl w-fit">
              <Choice active={mode === 'song'} onClick={() => setMode('song')}>{t('tabSong')}</Choice>
              <Choice active={mode === 'lyrics'} onClick={() => setMode('lyrics')}>{t('tabLyrics')}</Choice>
            </div>
            {mode === 'lyrics' && (
              <button
                type="button"
                onClick={startEditing}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/10 text-white text-xs font-bold hover:bg-white/15"
              >
                <Pencil size={15} /> {t('editLyrics')}
              </button>
            )}
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
              onClick={() => setStep(2)}
              className="w-full rounded-full bg-white py-3.5 text-sm font-black text-black transition hover:bg-white/90"
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
              <div className="space-y-2">
                <p className="text-sm font-black">{t('shareWithMessages')}</p>
                <p className="text-xs text-white/50">{t('inviteFriends')}</p>
                <div className="flex gap-3 overflow-x-auto pb-1" dir="ltr">
                  <button type="button" onClick={() => void handleCopyLink()} className={shareActionClass}>
                    <span className="w-8 h-8 rounded-full bg-white text-black flex items-center justify-center"><Link2 size={16} /></span>
                    {t('copyLink')}
                  </button>
                  <button type="button" onClick={handleWhatsapp} className={shareActionClass}>
                    <span className="w-8 h-8 rounded-full bg-[#25D366] text-black flex items-center justify-center"><MessageCircle size={16} /></span>
                    WhatsApp
                  </button>
                  <button type="button" onClick={handleStory} disabled={busy} className={shareActionClass}>
                    <span className="w-8 h-8 rounded-full bg-gradient-to-br from-fuchsia-500 to-orange-400 text-white flex items-center justify-center">
                      {busyIcon('story', <Images size={16} />)}
                    </span>
                    {t('stories')}
                  </button>
                  <button type="button" onClick={handleSms} className={shareActionClass}>
                    <span className="w-8 h-8 rounded-full bg-[#3B82F6] text-white flex items-center justify-center"><Send size={16} /></span>
                    SMS
                  </button>
                  <button type="button" onClick={handleStory} disabled={busy} className={shareActionClass}>
                    <span className="w-8 h-8 rounded-full bg-[#128C7E] text-white flex items-center justify-center">
                      {busyIcon('story', <Smartphone size={16} />)}
                    </span>
                    {t('status')}
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>,
    document.body
  )
}
