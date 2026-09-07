'use client'
import { useState, useEffect } from 'react'
import { collection, query, where, getDocs } from 'firebase/firestore'
import { useRouter } from 'next/navigation'
import { db } from '@/lib/firebase'
import SongCard from '@/components/SongCard'
import { useLanguage } from '@/app/context/LanguageContext'

type Song = {
  id: string
  titleAr: string
  titleEn: string
  artistAr?: string
  artistEn?: string
  audioUrl: string
  coverImageUrl: string
  year?: number
  isPublished: boolean
  plays: number
  likes: number
}

export default function SongsPage() {
  const [songs, setSongs] = useState<Song[]>([])
  const [loading, setLoading] = useState(true)
  const { t } = useLanguage()
  const router = useRouter()

  useEffect(() => {
    const fetchSongs = async () => {
      try {
        const q = query(collection(db, 'songs'), where('isPublished', '==', true))
        const snapshot = await getDocs(q)
        const songsList = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as Song))
        setSongs(songsList)
      } catch (error) {
        console.error('Error fetching songs:', error)
      } finally {
        setLoading(false)
      }
    }
    fetchSongs()
  }, [])

  const handleOpenSong = (songId: string) => {
    router.push(`/songs/${songId}`)
  }

  if (loading) {
    return <div className="p-8 text-center text-camel-coat">جارٍ التحميل...</div>
  }

  return (
    <div className="max-w-7xl mx-auto p-8">
      <h1 className="text-3xl font-bold text-camel-coat mb-8">{t('songs')}</h1>
      {songs.length === 0 ? (
        <p className="text-boho text-center py-12">{t('noSongs')}</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {songs.map((song) => (
            <div key={song.id} onClick={() => handleOpenSong(song.id)} className="cursor-pointer">
              <SongCard song={song} />
            </div>
          ))}
        </div>
      )}
    </div>
  )
}