'use client'
import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { db } from '@/lib/firebase'
import { doc, getDoc } from 'firebase/firestore'
import { Share2, Download, X } from 'lucide-react'
import toast from 'react-hot-toast'
import Link from 'next/link'

type Photo = {
  id: string
  imageUrl: string
  isPublished: boolean
}

export default function SinglePhotoPage() {
  const params = useParams()
  const photoId = params.photoId as string
  const [photo, setPhoto] = useState<Photo | null>(null)
  const [loading, setLoading] = useState(true)
  const [zoomed, setZoomed] = useState(false)

  useEffect(() => {
    const fetchPhoto = async () => {
      try {
        const docSnap = await getDoc(doc(db, 'photos', photoId))
        if (docSnap.exists() && docSnap.data().isPublished) {
          setPhoto({ id: docSnap.id, ...docSnap.data() } as Photo)
        }
      } catch (error) {
        console.error('Error fetching photo:', error)
      } finally {
        setLoading(false)
      }
    }
    fetchPhoto()
  }, [photoId])

  const handleShare = async () => {
    if (!photo) return
    const photoUrl = window.location.href
    const shareData = { title: 'صورة', text: 'شاهد هذه الصورة', url: photoUrl }
    if (navigator.share) {
      try {
        await navigator.share(shareData)
      } catch (error) {
        toast.error('تعذرت المشاركة')
      }
    } else {
      navigator.clipboard.writeText(photoUrl)
      toast.success('تم نسخ الرابط')
    }
  }

  const handleDownload = async () => {
    if (!photo) return
    try {
      const response = await fetch(photo.imageUrl)
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `maha-ftouni-${photo.id}.jpg`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)
    } catch (error) {
      toast.error('تعذر التحميل')
    }
  }

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center text-camel-coat">جارٍ التحميل...</div>
  }

  if (!photo) {
    return (
      <div className="min-h-screen flex items-center justify-center text-camel-coat">
        الصورة غير موجودة
      </div>
    )
  }

  return (
    <div className="fixed inset-0 bg-black/95 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-4xl flex-1 flex items-center justify-center overflow-hidden" onClick={() => setZoomed(!zoomed)}>
        <img
          src={photo.imageUrl}
          alt="صورة"
          className={`max-w-full max-h-full object-contain transition-transform duration-300 ${zoomed ? 'scale-150' : 'scale-100'}`}
        />
      </div>

      <div className="mt-4 flex gap-4">
        <button
          onClick={handleShare}
          className="bg-rubine text-white px-6 py-3 rounded-full flex items-center gap-2 hover:bg-tamarind transition"
        >
          <Share2 size={18} />
          مشاركة
        </button>
        <button
          onClick={handleDownload}
          className="bg-boho text-white px-6 py-3 rounded-full flex items-center gap-2 hover:bg-tamarind transition"
        >
          <Download size={18} />
          تحميل
        </button>
        <Link
          href="/gallery"
          className="bg-gray-700 text-white px-6 py-3 rounded-full flex items-center gap-2 hover:bg-gray-600 transition"
        >
          <X size={18} />
          إغلاق
        </Link>
      </div>
    </div>
  )
}