'use client'
import { Share2 } from 'lucide-react'
import { useLanguage } from '@/app/context/LanguageContext'
import { shareSong } from '@/lib/nativeShare'
import type { Song } from '@/lib/firestore'

type ShareableSong = Pick<Song, 'id' | 'titleAr' | 'titleEn' | 'artistEn' | 'artistAr' | 'coverImageUrl'>

type SongShareButtonProps = {
  song: ShareableSong
  className?: string
  size?: number
}

export default function SongShareButton({ song, className = '', size = 20 }: SongShareButtonProps) {
  const { t } = useLanguage()

  return (
    <button
      type="button"
      onClick={() => shareSong(song)}
      className={className}
      title={t('share')}
      aria-label={t('share')}
    >
      <Share2 size={size} />
    </button>
  )
}
