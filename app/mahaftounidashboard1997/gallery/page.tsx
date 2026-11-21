'use client'
import { useState, useEffect, useCallback } from 'react'
import Image from 'next/image'
import type { Timestamp } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc } from 'firebase/firestore'
import toast from 'react-hot-toast'
import { Trash2, Plus, Eye, EyeOff } from 'lucide-react'

type Photo = {
  id: string
  imageUrl: string
  isPublished: boolean
  createdAt?: Timestamp
}

type CloudinaryResult = {
  event?: string
  info?: { secure_url?: string }
}

type CloudinaryWidget = { open: () => void }

type CloudinaryApi = {
  createUploadWidget: (
    options: Record<string, unknown>,
    callback: (error: unknown, result: CloudinaryResult) => void
  ) => CloudinaryWidget
}

export default function AdminGalleryPage() {
  const [photos, setPhotos] = useState<Photo[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME

  useEffect(() => {
    const script = document.createElement('script')
    script.src = 'https://widget.cloudinary.com/v2.0/global/all.js'
    script.async = true
    document.body.appendChild(script)
    return () => {
      document.body.removeChild(script)
    }
  }, [])

  const fetchPhotos = useCallback(async () => {
    try {
      const snapshot = await getDocs(collection(db, 'photos'))
      const list = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as Photo))
      setPhotos(list)
    } catch {
      toast.error('تعذر جلب الصور')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchPhotos()
  }, [fetchPhotos])

  const openUploadWidget = () => {
    if (!cloudName) {
      toast.error('Cloudinary غير مهيأ')
      return
    }
    if (typeof window === 'undefined') {
      toast.error('سكربت Cloudinary لم يتم تحميله بعد')
      return
    }
    const cloudinaryWindow = window as Window & { cloudinary?: CloudinaryApi }
    if (!cloudinaryWindow.cloudinary) {
      toast.error('سكربت Cloudinary لم يتم تحميله بعد')
      return
    }

    const widget = cloudinaryWindow.cloudinary.createUploadWidget(
      {
        cloudName,
        uploadPreset: 'maha_fetouni_preset', // تأكد من وجود هذا الاسم في Cloudinary
        sources: ['local', 'url'],
        multiple: true,
        resourceType: 'image',
        folder: 'maha-fetouni/gallery',
        clientAllowedFormats: ['jpg', 'jpeg', 'png', 'webp'],
        maxImageFileSize: 5000000,
      },
      async (error: unknown, result: CloudinaryResult) => {
        if (error) {
          toast.error('خطأ في الرفع: ' + JSON.stringify(error))
          return
        }
        if (result && result.event === 'success' && result.info?.secure_url) {
          setUploading(true)
          try {
            await addDoc(collection(db, 'photos'), {
              imageUrl: result.info.secure_url,
              isPublished: true,
              createdAt: new Date(),
            })
            toast.success('تمت إضافة الصورة')
            fetchPhotos()
          } catch {
            toast.error('فشل حفظ الصورة في قاعدة البيانات')
          } finally {
            setUploading(false)
          }
        }
      }
    )
    widget.open()
  }

  const handleTogglePublish = async (photo: Photo) => {
    try {
      await updateDoc(doc(db, 'photos', photo.id), {
        isPublished: !photo.isPublished,
      })
      fetchPhotos()
    } catch {
      toast.error('تعذر التحديث')
    }
  }

  const handleDelete = async (id: string) => {
    if (confirm('حذف هذه الصورة؟')) {
      try {
        await deleteDoc(doc(db, 'photos', id))
        toast.success('تم الحذف')
        fetchPhotos()
      } catch {
        toast.error('تعذر الحذف')
      }
    }
  }

  if (loading) return <div className="p-8 text-center">جارٍ التحميل...</div>

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold">إدارة المعرض</h1>
        <button
          onClick={openUploadWidget}
          disabled={uploading}
          className="bg-rubine text-white px-4 py-2 rounded-full flex items-center gap-2 hover:bg-tamarind transition disabled:opacity-50"
        >
          <Plus size={18} />
          {uploading ? 'جارٍ الرفع...' : 'رفع صور متعددة'}
        </button>
      </div>

      {photos.length === 0 ? (
        <p className="text-center text-boho py-12">لا توجد صور بعد</p>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {photos.map((photo) => (
            <div key={photo.id} className="relative group">
              <Image
                src={photo.imageUrl}
                alt="صورة من معرض مهى فتوني"
                width={400}
                height={400}
                unoptimized
                className={`w-full aspect-square object-cover rounded-lg ${!photo.isPublished ? 'opacity-40' : ''}`}
              />
              <div className="absolute top-2 right-2 flex gap-2 opacity-0 group-hover:opacity-100 transition">
                <button
                  onClick={() => handleTogglePublish(photo)}
                  className={`p-1.5 rounded-full ${photo.isPublished ? 'bg-green-500 text-white' : 'bg-gray-500 text-white'}`}
                  title={photo.isPublished ? 'إخفاء' : 'إظهار'}
                >
                  {photo.isPublished ? <Eye size={14} /> : <EyeOff size={14} />}
                </button>
                <button
                  onClick={() => handleDelete(photo.id)}
                  className="bg-red-500 text-white p-1.5 rounded-full"
                  title="حذف"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}