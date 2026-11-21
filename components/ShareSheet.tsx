'use client'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import Image from 'next/image'
import { createPortal } from 'react-dom'
import { usePathname } from 'next/navigation'
import { Check, Copy, MessageCircle, MoreHorizontal, Send, X } from 'lucide-react'
import toast from 'react-hot-toast'
import { useLanguage } from '@/app/context/LanguageContext'
import { forceUnlockBodyScroll, lockBodyScroll, unlockBodyScroll } from '@/lib/bodyScrollLock'
import { drawShareCard, renderShareCard, SHARE_WATERMARK, DEFAULT_SHARE_OPTIONS, getPublicSiteOrigin, getPublicSongUrl, type ShareCardData } from '@/lib/shareCard'
import type { Song } from '@/lib/firestore'

type Step = 1 | 2 | 3 | 4
interface ShareSheetProps {
  currentSong: Song
  lines?: string[]
  language: 'ar' | 'en'
  initialMode?: 'song' | 'lyrics'
  initialStep?: Step
  onClose: () => void
}

export default function ShareSheet({ currentSong, lines, language, initialMode = 'song', onClose }: ShareSheetProps) {
  const { t } = useLanguage()
  const pathname = usePathname()
  const pathnameRef = useRef(pathname)
  const onCloseRef = useRef(onClose)
  const [mounted, setMounted] = useState(false)
  const [copied, setCopied] = useState(false)
  const [busy, setBusy] = useState('')
  const cardRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => { onCloseRef.current = onClose }, [onClose])
  useEffect(() => { setMounted(true) }, [])
  useEffect(() => { pathnameRef.current = pathname }, [pathname])

  const isSiteShare = !currentSong.id
  const title = language === 'ar' ? (currentSong.titleAr || currentSong.titleEn) : (currentSong.titleEn || currentSong.titleAr)
  const artist = language === 'ar' ? (currentSong.artistAr || currentSong.artistEn || 'مهى فتوني') : (currentSong.artistEn || currentSong.artistAr || 'Maha Ftouni')
  const siteOrigin = useMemo(() => (typeof window !== 'undefined' ? window.location.origin : getPublicSiteOrigin()), [])
  const shareUrl = useMemo(() => isSiteShare ? siteOrigin : (currentSong.id ? getPublicSongUrl(currentSong.id) : siteOrigin), [isSiteShare, siteOrigin, currentSong.id])
  const shareText = isSiteShare
    ? (language === 'ar' ? 'الموقع الرسمي للمطربة اللبنانية مهى فتوني' : 'Official website of Lebanese singer Maha Ftouni')
    : `${title} - ${artist}`
  const shareTitle = isSiteShare ? (language === 'ar' ? 'مهى فتوني | الموقع الرسمي' : 'Maha Ftouni | Official Website') : `${title} - ${artist}`
  const cover = currentSong.coverImageUrl || '/icon-512x512.png'

  const cardData: ShareCardData = useMemo(() => ({
    title,
    artist,
    coverUrl: cover,
    backgroundUrl: cover,
    lines: (lines || []).slice(0, 5),
    palette: { dominant: '#7B2D2D', palette: ['#7B2D2D', '#C6B39A', '#280B0F'] },
    language,
  }), [title, artist, cover, lines, language])

  useEffect(() => {
    if (!mounted) return
    lockBodyScroll()
    const close = () => { forceUnlockBodyScroll(); onCloseRef.current() }
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') { e.preventDefault(); close() } }
    const onPop = () => forceUnlockBodyScroll()
    window.addEventListener('keydown', onKey, true)
    window.addEventListener('popstate', onPop)
    return () => {
      window.removeEventListener('keydown', onKey, true)
      window.removeEventListener('popstate', onPop)
      unlockBodyScroll()
    }
  }, [mounted])

  useEffect(() => {
    if (pathnameRef.current !== pathname) { forceUnlockBodyScroll(); onCloseRef.current() }
  }, [pathname])

  useEffect(() => {
    if (!mounted || !cardRef.current) return
    void drawShareCard(cardRef.current, cardData, { ...DEFAULT_SHARE_OPTIONS, background: 'gradient' }).catch(() => undefined)
  }, [mounted, cardData])

  const close = useCallback(() => { forceUnlockBodyScroll(); onClose() }, [onClose])

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl)
      setCopied(true)
      toast.success(language === 'ar' ? 'تم النسخ' : 'Copied')
      setTimeout(() => setCopied(false), 1500)
    } catch {
      toast.error(t('shareFailed'))
    }
  }

  const getPngFile = async () => {
    const result = cardRef.current
      ? await new Promise<{ blob: Blob }>((resolve, reject) => cardRef.current!.toBlob((b) => b ? resolve({ blob: b }) : reject(new Error('blob')), 'image/png'))
      : await renderShareCard(cardData, { ...DEFAULT_SHARE_OPTIONS, background: 'gradient' })
    return new File([result.blob], `${SHARE_WATERMARK}-${title.replace(/[^\w\u0600-\u06FF-]+/g, '-')}.png`, { type: 'image/png' })
  }

  const shareLink = async () => {
    if (navigator.share) {
      try { await navigator.share({ title: shareTitle, text: shareText, url: shareUrl }); return } catch (e) { if (e instanceof DOMException && e.name === 'AbortError') return }
    }
    await copyLink()
  }

  const shareToUrl = async (platform: string) => {
    const encoded = encodeURIComponent(shareUrl)
    const textEnc = encodeURIComponent(shareText)
    const map: Record<string, string> = {
      whatsapp: `https://wa.me/?text=${encoded}`,
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${encoded}`,
      telegram: `https://t.me/share/url?url=${encoded}&text=${textEnc}`,
      x: `https://twitter.com/intent/tweet?url=${encoded}&text=${textEnc}`,
      sms: `sms:?body=${encoded}`,
    }
    if (map[platform]) { window.open(map[platform], '_blank', 'noopener,noreferrer'); return }
    // image platforms fallback to link share
    await shareLink()
  }

  const onShare = async (key: string) => {
    if (busy) return
    setBusy(key)
    try {
      if (key === 'more') { await shareLink(); return }
      if (key === 'copy') { await copyLink(); return }
      if (key === 'sms') { window.location.href = `sms:?body=${encodeURIComponent(shareUrl)}`; return }

      const linkPlatforms = ['whatsapp', 'facebook', 'telegram', 'x']
      const imagePlatforms = ['instagram', 'snapchat', 'tiktok']

      if (imagePlatforms.includes(key)) {
        if (navigator.share) {
          try {
            const file = await getPngFile()
            if (navigator.canShare?.({ files: [file] })) {
              await navigator.share({ files: [file] })
              return
            }
          } catch (e) { if (e instanceof DOMException && e.name === 'AbortError') return }
        }
        // fallback: try normal share, else open platform impossible - silent no-op/copy? no download message
        if (navigator.share) { try { await navigator.share({ title: shareTitle, url: shareUrl }); return } catch (e) { if (e instanceof DOMException && e.name === 'AbortError') return } }
        await shareToUrl(key)
        return
      }

      if (linkPlatforms.includes(key)) {
        if (navigator.share) {
          try { await navigator.share({ title: shareTitle, text: shareText, url: shareUrl }); return } catch (e) { if (e instanceof DOMException && e.name === 'AbortError') return }
        }
        await shareToUrl(key)
        return
      }

      await shareToUrl(key)
    } catch (e) {
      if (!(e instanceof DOMException && e.name === 'AbortError')) toast.error(t('shareFailed'))
    } finally {
      setBusy('')
    }
  }

  if (!mounted) return null

  const items = [
    { key: 'whatsapp', label: 'WhatsApp', bg: 'bg-[#25D366]', icon: <MessageCircle size={20} /> },
    { key: 'facebook', label: 'Facebook', bg: 'bg-[#1877F2]', icon: <span className="font-bold text-lg">f</span> },
    { key: 'telegram', label: 'Telegram', bg: 'bg-[#229ED9]', icon: <Send size={20} /> },
    { key: 'x', label: 'X', bg: 'bg-black', icon: <span className="font-bold text-lg">X</span> },
    { key: 'snapchat', label: 'Snapchat', bg: 'bg-[#FFFC00] text-black', icon: <span className="font-bold">👻</span> },
    { key: 'tiktok', label: 'TikTok', bg: 'bg-black border border-white/10', icon: <span className="font-bold">♪</span> },
    { key: 'instagram', label: 'Instagram', bg: 'bg-gradient-to-br from-fuchsia-500 via-red-500 to-orange-400', icon: <span className="font-bold text-sm">IG</span> },
    { key: 'sms', label: 'SMS', bg: 'bg-[#34C759]', icon: <Send size={20} /> },
    { key: 'more', label: language === 'ar' ? 'المزيد' : 'More', bg: 'bg-white/15', icon: <MoreHorizontal size={20} /> },
  ]

  return createPortal(
    <div className="fixed inset-0 z-[300] flex items-end sm:items-center justify-center p-3 bg-black/50 backdrop-blur-sm" onClick={close} dir={language === 'ar' ? 'rtl' : 'ltr'}>
      <div className="w-full max-w-[420px] mx-auto rounded-3xl bg-zinc-950/95 text-white border border-white/10 shadow-2xl p-4 sm:p-5" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-bold">{t('share')}</h3>
          <button onClick={close} className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/15 flex items-center justify-center" aria-label={t('close')}><X size={16} /></button>
        </div>

        <div className="flex items-center gap-3 rounded-2xl bg-white/5 border border-white/10 p-3 mb-4">
          <div className="relative w-16 h-16 rounded-xl overflow-hidden shrink-0 bg-white/10">
            <Image src={cover} alt={title} fill className="object-cover" sizes="64px" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="font-bold text-sm truncate">{title}</div>
            <div className="text-xs text-white/60 truncate">{artist}</div>
            <div className="text-[11px] text-white/40 truncate mt-1">{shareUrl}</div>
          </div>
        </div>

        <canvas ref={cardRef} className="hidden" width={1080} height={1350} />

        <button onClick={() => void onShare('copy')} className="w-full mb-4 flex items-center justify-center gap-2 rounded-2xl bg-white text-black py-3 font-bold text-sm hover:bg-white/90 transition">
          {copied ? <Check size={16} /> : <Copy size={16} />}
          <span>{language === 'ar' ? 'نسخ' : 'Copy'}</span>
        </button>

        <div className="flex gap-4 overflow-x-auto pb-1 -mx-1 px-1" style={{ scrollbarWidth: 'none' }}>
          {items.map((item) => (
            <button key={item.key} type="button" disabled={busy === item.key} onClick={() => void onShare(item.key)} className="flex flex-col items-center gap-2 min-w-[58px] text-[11px] text-white/80 disabled:opacity-50">
              <span className={`w-12 h-12 rounded-full flex items-center justify-center text-white ${item.bg}`}>{busy === item.key ? <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" /> : item.icon}</span>
              <span className="whitespace-nowrap">{item.label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>,
    document.body
  )
}
