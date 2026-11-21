'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { db } from '@/lib/firebase'
import { collection, query, where, getDocs } from 'firebase/firestore'
import type { Timestamp } from 'firebase/firestore'
import { useLanguage } from '@/app/context/LanguageContext'
import { ImageOff } from 'lucide-react'

type Photo = {
  id: string
  imageUrl: string
  isPublished: boolean
  createdAt?: Timestamp
}

export default function GalleryPage() {
  const [photos, setPhotos] = useState<Photo[]>([])
  const [loading, setLoading] = useState(true)
  const { t } = useLanguage()
  const router = useRouter()

  useEffect(() => {
    const fetchPhotos = async () => {
      try {
        const q = query(collection(db, 'photos'), where('isPublished', '==', true))
        const snapshot = await getDocs(q)
        const photosList = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as Photo))
        setPhotos(photosList)
      } catch (error) {
        console.error('Error fetching photos:', error)
      } finally {
        setLoading(false)
      }
    }
    fetchPhotos()
  }, [])

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center text-camel-coat">جارٍ التحميل...</div>
  }

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-8">
      <h1 className="text-3xl font-bold text-camel-coat mb-8 text-center md:text-right">{t('gallery')}</h1>

      {photos.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-boho">
          <ImageOff size={48} className="mb-4 opacity-50" />
          <p className="text-lg">لا توجد صور منشورة بعد</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4">
          {photos.map((photo) => (
            <div
              key={photo.id}
              className="relative aspect-square overflow-hidden rounded-xl bg-tamarind cursor-pointer group"
              onClick={() => router.push(`/gallery/photo/${photo.id}`)}
            >
              <Image
                src={photo.imageUrl}
                alt={`صورة من المعرض ${photo.id}`}
                fill
                sizes="(max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
                className="object-cover transition-transform duration-300 group-hover:scale-105"
              />
            </div>
          ))}
        </div>
      )}
    </div>
  )
}