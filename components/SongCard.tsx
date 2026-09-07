'use client'
import { useLanguage } from '@/app/context/LanguageContext'

type SongCardProps = {
  song: {
    id: string
    titleAr: string
    titleEn: string
    artistAr?: string
    artistEn?: string
    coverImageUrl: string
    year?: number
  }
}

export default function SongCard({ song }: SongCardProps) {
  const { language } = useLanguage()
  const title = language === 'ar' ? song.titleAr || song.titleEn : song.titleEn || song.titleAr
  const artist = language === 'ar' ? song.artistAr || 'مهى فتوني' : song.artistEn || 'Maha Fetouni'

  return (
    <div className="bg-tamarind rounded-xl overflow-hidden shadow-lg hover:shadow-xl transition group cursor-pointer">
      <div className="relative aspect-square overflow-hidden">
        <img
          src={song.coverImageUrl}
          alt={title}
          className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
        />
      </div>
      <div className="p-4 text-center">
        <h3 className="text-camel-coat font-semibold group-hover:text-rubine transition truncate">
          {title}
        </h3>
        <p className="text-boho text-xs mt-1 truncate">{artist}</p>
        {song.year && <p className="text-boho/70 text-xs mt-1">{song.year}</p>}
      </div>
    </div>
  )
}