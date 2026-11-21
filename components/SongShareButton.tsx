'use client'
import { useState } from 'react'
import { Share2 } from 'lucide-react'
import { useLanguage } from '@/app/context/LanguageContext'
import ShareSheet from '@/components/ShareSheet'
import type { Song } from '@/lib/firestore'

type ShareableSong = Pick<Song, 'id' | 'titleAr' | 'titleEn' | 'artistEn' | 'artistAr' | 'coverImageUrl'>

type SongShareButtonProps = {
  song: ShareableSong
  className?: string
  size?: number
}

export default function SongShareButton({ song, className = '', size = 20 }: SongShareButtonProps) {
  const { language, t } = useLanguage()
  const [isOpen, setIsOpen] = useState(false)

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className={className}
        title={t('share')}
        aria-label={t('share')}
      >
        <Share2 size={size} />
      </button>

      {isOpen && (
        <ShareSheet
          currentSong={song as Song}
          language={language}
          initialMode="song"
          initialStep={4}
          onClose={() => setIsOpen(false)}
        />
      )}
    </>
  )
}
