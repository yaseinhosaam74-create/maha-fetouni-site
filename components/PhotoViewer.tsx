'use client'
import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { Share2, Download, X, ZoomIn, ZoomOut, ChevronRight, ChevronLeft } from 'lucide-react'
import toast from 'react-hot-toast'

type Photo = {
  id: string
  imageUrl: string
  isPublished: boolean
}

type PhotoViewerProps = {
  photos: Photo[]
  initialIndex: number
  initialPhoto: Photo | null
}

export default function PhotoViewer({ photos, initialIndex, initialPhoto }: PhotoViewerProps) {
  const router = useRouter()
  const [currentIndex, setCurrentIndex] = useState(initialIndex)
  const [zoomed, setZoomed] = useState(false)
  const touchStartY = useRef(0)
  const touchStartX = useRef(0)

  const currentPhoto = photos[currentIndex] || initialPhoto

  const goNext = () => {
    if (currentIndex < photos.length - 1) {
      setCurrentIndex((prev) => prev + 1)
      setZoomed(false)
    }
  }

  const goPrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1)
      setZoomed(false)
    }
  }

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartY.current = e.touches[0].clientY
    touchStartX.current = e.touches[0].clientX
  }

  const handleTouchEnd = (e: React.TouchEvent) => {
    const deltaY = e.changedTouches[0].clientY - touchStartY.current
    const deltaX = e.changedTouches[0].clientX - touchStartX.current

    if (deltaY > 80 && Math.abs(deltaY) > Math.abs(deltaX)) {
      router.push('/gallery')
    } else if (Math.abs(deltaX) > 60 && Math.abs(deltaX) > Math.abs(deltaY)) {
      if (deltaX > 0) goPrev()
      else goNext()
    }
  }

  const handleShare = async () => {
    if (!currentPhoto) return
    const photoUrl = `${window.location.origin}/gallery/photo/${currentPhoto.id}`
    if (navigator.share) {
      try {
        await navigator.share({ title: 'صورة', text: 'شاهد هذه الصورة', url: photoUrl })
      } catch (error) {
        toast.error('تعذرت المشاركة')
      }
    } else {
      navigator.clipboard.writeText(photoUrl)
      toast.success('تم نسخ رابط الصورة')
    }
  }

  const handleDownload = async () => {
    if (!currentPhoto) return
    try {
      const response = await fetch(currentPhoto.imageUrl)
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `maha-ftouni-${currentPhoto.id}.jpg`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)
    } catch (error) {
      toast.error('تعذر التحميل')
    }
  }

  return (
    <div
      className="fixed inset-0 z-[10000] bg-black flex items-center justify-center"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* الشريط العلوي */}
      <div className="absolute top-0 left-0 right-0 flex justify-between items-center p-4 z-20">
        <button
          onClick={() => router.push('/gallery')}
          className="bg-white/10 hover:bg-white/20 backdrop-blur-md p-3 rounded-full text-white transition"
          title="العودة للمعرض"
        >
          <X size={24} />
        </button>
        <button
          onClick={() => setZoomed(!zoomed)}
          className="bg-white/10 hover:bg-white/20 backdrop-blur-md p-3 rounded-full text-white transition"
          title={zoomed ? 'تصغير' : 'تكبير'}
        >
          {zoomed ? <ZoomOut size={24} /> : <ZoomIn size={24} />}
        </button>
      </div>

      {/* أزرار التنقل */}
      <button
        onClick={goPrev}
        disabled={currentIndex === 0}
        className="absolute left-4 top-1/2 -translate-y-1/2 z-20 bg-white/10 hover:bg-white/20 backdrop-blur-md p-3 rounded-full text-white transition disabled:opacity-30"
      >
        <ChevronLeft size={24} />
      </button>
      <button
        onClick={goNext}
        disabled={currentIndex === photos.length - 1}
        className="absolute right-4 top-1/2 -translate-y-1/2 z-20 bg-white/10 hover:bg-white/20 backdrop-blur-md p-3 rounded-full text-white transition disabled:opacity-30"
      >
        <ChevronRight size={24} />
      </button>

      {/* الصورة مع أنيميشن */}
      <AnimatePresence mode="wait">
        <motion.img
          key={currentPhoto?.id || 'no-photo'}
          src={currentPhoto?.imageUrl || ''}
          alt="صورة"
          className="absolute inset-0 w-full h-full object-contain"
          style={{ transform: zoomed ? 'scale(1.1)' : 'scale(1)', transition: 'transform 0.3s ease' }}
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: zoomed ? 1.1 : 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 0.3 }}
          onClick={() => setZoomed(!zoomed)}
        />
      </AnimatePresence>

      {/* الشريط السفلي */}
      <div className="absolute bottom-0 left-0 right-0 flex justify-center gap-4 p-4 z-20">
        <button
          onClick={handleShare}
          disabled={!currentPhoto}
          className="bg-white/10 hover:bg-white/20 backdrop-blur-md px-6 py-3 rounded-full text-white flex items-center gap-2 transition disabled:opacity-50"
        >
          <Share2 size={20} />
          مشاركة
        </button>
        <button
          onClick={handleDownload}
          disabled={!currentPhoto}
          className="bg-white/10 hover:bg-white/20 backdrop-blur-md px-6 py-3 rounded-full text-white flex items-center gap-2 transition disabled:opacity-50"
        >
          <Download size={20} />
          تحميل
        </button>
      </div>
    </div>
  )
}