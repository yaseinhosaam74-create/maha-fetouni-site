'use client'

import { useEffect, useState, useRef, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Loader2, Share2, Download, Copy, Maximize, Minimize, AlignRight, AlignCenter, AlignLeft, ArrowDown } from 'lucide-react'
import { Lrc } from 'lrc-kit'
import toast from 'react-hot-toast'
import { useLanguage } from '@/app/context/LanguageContext'
import { shareLyricsAsImage } from '@/lib/nativeShare'

interface FullScreenLyricsProps {
  isOpen: boolean
  onClose: () => void
  lrcText: string | undefined
  plainText: string | undefined
  currentTime: number
  duration: number
  title: string
  artist: string
  onSeek: (time: number) => void
  coverImageUrl: string
  songId?: string
}

export default function FullScreenLyrics({ 
  isOpen, onClose, lrcText, plainText, currentTime, duration, title, artist, onSeek, coverImageUrl, songId
}: FullScreenLyricsProps) {
  const { language } = useLanguage()
  const [activeIndex, setActiveIndex] = useState(0)
  const [fetchedLrc, setFetchedLrc] = useState<string>('')
  const [isLoading, setIsLoading] = useState(false)
  
  const [isFullscreen, setIsFullscreen] = useState(true)
  const [isShareMode, setIsShareMode] = useState(false)
  const [selectedLines, setSelectedLines] = useState<number[]>([])
  const [isGeneratingImage, setIsGeneratingImage] = useState(false)
  const [textAlignment, setTextAlignment] = useState<'right' | 'center' | 'left'>('center')
  const [isScrolledAway, setIsScrolledAway] = useState(false)
  
  const containerRef = useRef<HTMLDivElement>(null)
  const shareCardRef = useRef<HTMLDivElement>(null)

  const t = {
    share: language === 'ar' ? 'مشاركة' : 'Share',
    copy: language === 'ar' ? 'نسخ النص' : 'Copy Text',
    copied: language === 'ar' ? 'تم نسخ الكلمات!' : 'Lyrics copied!',
    fullscreen: language === 'ar' ? 'ملء الشاشة' : 'Fullscreen',
    exitFull: language === 'ar' ? 'إنهاء ملء الشاشة' : 'Exit Fullscreen',
    selectLines: language === 'ar' ? 'حدد حتى 4 أسطر للمشاركة' : 'Select up to 4 lines',
    maxLines: language === 'ar' ? 'يمكنك تحديد 4 أسطر كحد أقصى' : 'Maximum 4 lines allowed',
    genImg: language === 'ar' ? 'مشاركة الصورة' : 'Share Image',
    noLyrics: language === 'ar' ? 'لا توجد كلمات متاحة' : 'No lyrics available',
    loading: language === 'ar' ? 'جاري جلب الكلمات...' : 'Fetching lyrics...',
    sync: language === 'ar' ? 'العودة للمقطع الحالي' : 'Back to current line',
  }

  // منع التمرير في الخلفية عند الفتح
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
      document.body.style.position = ''
      document.body.classList.remove('overflow-hidden')
      document.querySelectorAll('[data-native-share-menu="true"]').forEach((element) => element.remove())
    }
    return () => {
      document.body.style.overflow = ''
      document.body.style.position = ''
      document.body.classList.remove('overflow-hidden')
      document.querySelectorAll('[data-native-share-menu="true"]').forEach((element) => element.remove())
    }
  }, [isOpen])

  // جلب الكلمات تلقائياً
  useEffect(() => {
    if (!isOpen || lrcText) return;
    const fetchRealLyrics = async () => {
      setIsLoading(true)
      try {
        const res = await fetch(`https://lrclib.net/api/search?track_name=${encodeURIComponent(title)}&artist_name=${encodeURIComponent(artist)}`)
        const data = await res.json()
        if (data && data.length > 0) {
          const bestMatch = data.find((item: { syncedLyrics?: string }) => item.syncedLyrics)
          if (bestMatch) setFetchedLrc(bestMatch.syncedLyrics)
        }
      } catch (error) { console.error(error) } finally { setIsLoading(false) }
    }
    fetchRealLyrics()
  }, [isOpen, lrcText, title, artist])

  // تحليل النص
  const textToParse = useMemo(() => {
    if (lrcText && lrcText.includes('[')) return lrcText;
    if (fetchedLrc) return fetchedLrc;
    if (!plainText || !duration) return '';
    const lines = plainText.split('\n').map(l => l.trim()).filter(l => l !== '');
    if (lines.length === 0) return '';
    const timePerLine = duration / lines.length;
    return lines.map((line, index) => {
      const time = index * timePerLine;
      const mm = String(Math.floor(time / 60)).padStart(2, '0');
      const ss = String(Math.floor(time % 60)).padStart(2, '0');
      return `[${mm}:${ss}.00] ${line}`;
    }).join('\n');
  }, [lrcText, fetchedLrc, plainText, duration]);

  const lyricsArray = useMemo(() => {
    if (!textToParse) return []
    try { return Lrc.parse(textToParse).lyrics || [] } catch (error) { return [] }
  }, [textToParse])

  // السطر النشط
  useEffect(() => {
    if (lyricsArray.length === 0) return
    let newIndex = 0
    for (let i = 0; i < lyricsArray.length; i++) {
      if (currentTime >= lyricsArray[i].timestamp) newIndex = i;
      else break;
    }
    setActiveIndex(newIndex)
  }, [currentTime, lyricsArray])

  // التمرير التلقائي
  useEffect(() => {
    if (isOpen && containerRef.current && !isShareMode && !isScrolledAway) {
      const activeElement = containerRef.current.children[activeIndex] as HTMLElement
      if (activeElement) activeElement.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }
  }, [activeIndex, isOpen, isShareMode, isScrolledAway])

  // زر Esc
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (isShareMode) { setIsShareMode(false); setSelectedLines([]); } 
        else { onClose() }
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isShareMode, onClose])

  useEffect(() => {
    if (!isOpen) {
      setIsShareMode(false); setSelectedLines([]); setIsFullscreen(true); setIsScrolledAway(false)
    }
  }, [isOpen])

  // اكتشاف التمرير بعيداً
  const handleScroll = () => {
    if (!containerRef.current || isShareMode) return
    const container = containerRef.current
    const activeElement = container.children[activeIndex] as HTMLElement
    if (activeElement) {
      const rect = activeElement.getBoundingClientRect()
      const containerRect = container.getBoundingClientRect()
      if (rect.bottom < containerRect.top + 50 || rect.top > containerRect.bottom - 50) {
        setIsScrolledAway(true)
      } else { setIsScrolledAway(false) }
    }
  }

  const handleSyncClick = () => {
    setIsScrolledAway(false)
    if (containerRef.current) {
      const activeElement = containerRef.current.children[activeIndex] as HTMLElement
      if (activeElement) activeElement.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }
  }

  const handleLineClick = (index: number, timestamp: number) => {
    if (isShareMode) {
      if (selectedLines.includes(index)) { setSelectedLines(prev => prev.filter(i => i !== index)) } 
      else {
        if (selectedLines.length < 4) { setSelectedLines(prev => [...prev, index].sort((a, b) => a - b)) } 
        else { toast.error(t.maxLines) }
      }
    } else { onSeek(timestamp) }
  }

  const handleCopyText = () => {
    const text = selectedLines.map(i => lyricsArray[i].content).join('\n')
    navigator.clipboard.writeText(text)
    toast.success(t.copied)
  }

  const handleShareImage = async () => {
    if (!shareCardRef.current || selectedLines.length === 0) return
    setIsGeneratingImage(true)
    try {
      await shareLyricsAsImage(
        {
          id: songId || '',
          titleAr: title,
          titleEn: title,
          artistAr: artist,
          artistEn: artist,
          coverImageUrl,
        },
        selectedLines.map(index => lyricsArray[index]?.content || '').filter(Boolean)
      )
      setIsShareMode(false); setSelectedLines([])
    } catch (error) { toast.error('تعذر إنشاء الصورة') } finally { setIsGeneratingImage(false) }
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className={`fixed z-[999999] bg-[#121212] flex flex-col overflow-hidden transition-all duration-300 ${
            isFullscreen ? 'inset-0' : 'inset-4 md:inset-10 rounded-3xl border border-white/10'
          }`}
          dir={language === 'ar' ? 'rtl' : 'ltr'}
        >
          {/* الخلفية */}
          <div 
            className="absolute inset-0 bg-cover bg-center transition-all duration-1000"
            style={{ backgroundImage: `url(${coverImageUrl})`, filter: 'blur(40px) brightness(0.3)', transform: 'scale(1.2)' }}
          />
          <div className="absolute inset-0 bg-black/50" />

          {/* الهيدر */}
          <div className="relative z-10 flex justify-between items-center p-5 border-b border-white/10 bg-black/30 backdrop-blur-md">
            <div className="flex items-center gap-4">
              <img src={coverImageUrl} className="w-12 h-12 rounded-lg object-cover shadow-xl border border-white/20" />
              <div>
                <h2 className="text-white text-lg font-bold line-clamp-1">{title}</h2>
                <p className="text-gray-300 text-sm line-clamp-1">{artist}</p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              {!isShareMode && (
                <button onClick={() => setIsShareMode(true)} className="p-2 text-gray-300 hover:text-white transition" title={t.share}>
                  <Share2 size={22} />
                </button>
              )}
              <button onClick={() => setIsFullscreen(!isFullscreen)} className="p-2 text-gray-300 hover:text-white transition" title={isFullscreen ? t.exitFull : t.fullscreen}>
                {isFullscreen ? <Minimize size={22} /> : <Maximize size={22} />}
              </button>
              <button onClick={onClose} className="p-2 text-gray-300 hover:text-white transition">
                <X size={28} />
              </button>
            </div>
          </div>

          {/* وضع المشاركة */}
          {isShareMode && (
            <div className="relative z-10 bg-rubine/10 backdrop-blur-xl p-4 flex justify-between items-center border-b border-white/10">
              <span className="text-white text-sm font-bold">{t.selectLines} ({selectedLines.length}/4)</span>
              <div className="flex gap-2">
                <button onClick={handleCopyText} disabled={selectedLines.length === 0} className="p-2 bg-white/10 rounded-lg text-white disabled:opacity-50" title={t.copy}>
                  <Copy size={18} />
                </button>
                <button onClick={() => { setIsShareMode(false); setSelectedLines([]); }} className="px-3 py-1 bg-white/10 rounded-lg text-white text-sm hover:bg-white/20 transition">
                  {language === 'ar' ? 'إلغاء' : 'Cancel'}
                </button>
              </div>
            </div>
          )}

          {/* الكلمات */}
          <div 
            ref={containerRef}
            onScroll={handleScroll}
            className="relative z-10 flex-1 overflow-y-auto overflow-x-hidden px-6 space-y-6 py-[30vh]"
            style={{ 
              scrollbarWidth: 'none', msOverflowStyle: 'none',
              maskImage: 'linear-gradient(to bottom, transparent, black 10%, black 90%, transparent)',
              WebkitMaskImage: 'linear-gradient(to bottom, transparent, black 10%, black 90%, transparent)'
            }}
          >
            {isLoading ? (
              <div className="flex justify-center items-center h-full text-white/70"><Loader2 className="animate-spin mr-2" /> {t.loading}</div>
            ) : lyricsArray.length === 0 ? (
              <p className="text-white/70 text-lg text-center mt-20">{t.noLyrics}</p>
            ) : (
              lyricsArray.map((line, index) => {
                const isActive = index === activeIndex
                const isSelected = selectedLines.includes(index)
                return (
                  <div key={index} className={`flex justify-center ${isShareMode ? 'cursor-pointer' : ''}`} onClick={() => handleLineClick(index, line.timestamp)}>
                    <p
                      className={`transition-all duration-300 text-center font-bold px-6 py-3 rounded-2xl text-xl md:text-3xl ${
                        isSelected 
                          ? 'bg-rubine/20 text-rubine scale-105' 
                          : isActive && !isShareMode
                            ? 'text-rubine scale-110 drop-shadow-[0_0_20px_rgba(200,50,50,0.6)]' 
                            : 'text-white/40 hover:text-white/60'
                      }`}
                    >
                      {line.content}
                    </p>
                  </div>
                )
              })
            )}
          </div>

          {/* زر الـ Sync */}
          {isScrolledAway && !isShareMode && (
            <button 
              onClick={handleSyncClick} 
              className="absolute bottom-24 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2 px-4 py-2 bg-rubine text-white rounded-full text-sm font-bold shadow-lg animate-bounce"
            >
              <ArrowDown size={18} /> {t.sync}
            </button>
          )}

          {/* شريط أدوات المشاركة السفلي */}
          {isShareMode && selectedLines.length > 0 && (
            <div className="relative z-10 p-4 bg-black/80 backdrop-blur-xl border-t border-white/10 flex flex-col gap-4">
              <div className="flex justify-center gap-4">
                <button onClick={() => setTextAlignment('right')} className={`p-2 rounded-lg transition ${textAlignment === 'right' ? 'bg-rubine/30 text-rubine' : 'bg-white/5 text-gray-400'}`}><AlignRight size={20} /></button>
                <button onClick={() => setTextAlignment('center')} className={`p-2 rounded-lg transition ${textAlignment === 'center' ? 'bg-rubine/30 text-rubine' : 'bg-white/5 text-gray-400'}`}><AlignCenter size={20} /></button>
                <button onClick={() => setTextAlignment('left')} className={`p-2 rounded-lg transition ${textAlignment === 'left' ? 'bg-rubine/30 text-rubine' : 'bg-white/5 text-gray-400'}`}><AlignLeft size={20} /></button>
              </div>
              <button onClick={handleShareImage} disabled={isGeneratingImage} className="w-full bg-rubine text-white py-3 rounded-xl font-bold flex justify-center items-center gap-2 hover:bg-red-700 transition">
                {isGeneratingImage ? <Loader2 className="animate-spin" /> : <Download size={20} />} {t.genImg}
              </button>
            </div>
          )}

          {/* قالب الصورة المخفي */}
          <div className="fixed top-0 left-0 -z-50 pointer-events-none opacity-0">
             <div ref={shareCardRef} className="w-[1080px] h-[1080px] relative flex flex-col justify-between p-16 overflow-hidden bg-black" dir={language === 'ar' ? 'rtl' : 'ltr'}>
                <img src={coverImageUrl} crossOrigin="anonymous" className="absolute inset-0 w-full h-full object-cover opacity-40 blur-3xl scale-110" />
                <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-black/40 to-black/90" />
                <div className={`relative z-10 w-full mt-10 flex ${textAlignment === 'center' ? 'flex-col items-center text-center' : textAlignment === 'right' ? 'flex-col items-end text-right' : 'flex-col items-start text-left'}`}>
                  <img src={coverImageUrl} crossOrigin="anonymous" className="w-40 h-40 rounded-xl shadow-2xl mb-8 object-cover border-2 border-white/20" />
                  <div className="space-y-6">
                    {selectedLines.map(index => (
                      <p key={index} className="text-white text-4xl font-bold leading-relaxed drop-shadow-lg">{lyricsArray[index]?.content}</p>
                    ))}
                  </div>
                </div>
                <div className={`relative z-10 mt-auto pt-6 border-t border-white/20 w-full flex items-center justify-between`}>
                  <div>
                    <h3 className="text-white text-3xl font-black">{language === 'ar' ? 'مهى فتوني' : 'Maha Ftouni'}</h3>
                    <p className="text-gray-300 text-lg">{title}</p>
                  </div>
                  <div className="text-white/50 text-sm">maha-ftouni.com</div>
                </div>
             </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}