'use client'
import { useMemo } from 'react'
import Image from 'next/image'
import { createPortal } from 'react-dom'
import { X } from 'lucide-react'
import { useTheme } from './ThemeContext'
import { useLanguage } from '@/app/context/LanguageContext'

type QRModalProps = {
  isOpen: boolean
  onClose: () => void
}

export default function QRModal({ isOpen, onClose }: QRModalProps) {
  const { theme } = useTheme()
  const { t } = useLanguage()
  const origin = useMemo(() => (typeof window === 'undefined' ? '' : window.location.origin), [])

  if (!isOpen || typeof document === 'undefined') return null

  const qrSrc = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(origin)}`

  return createPortal(
    <div
      className="fixed inset-0 z-[1000] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className={`w-full max-w-xs sm:max-w-sm p-6 rounded-3xl text-center shadow-2xl ${
          theme === 'dark'
            ? 'bg-italian-roast border border-tamarind text-camel-coat'
            : 'bg-white border border-gray-200 text-gray-900'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-bold text-lg">{t('shareApp')}</h3>
          <button
            onClick={onClose}
            className="p-1 rounded-full hover:bg-tamarind transition"
            aria-label={t('close')}
          >
            <X size={20} />
          </button>
        </div>
        <div className="bg-white p-3 rounded-2xl inline-block">
          <Image
            src={qrSrc}
            alt="QR Code"
            width={208}
            height={208}
            unoptimized
            className="w-44 h-44 sm:w-52 sm:h-52 object-contain"
          />
        </div>
        <p className="text-sm mt-4 opacity-70">{t('qrScan')}</p>
      </div>
    </div>,
    document.body
  )
}
