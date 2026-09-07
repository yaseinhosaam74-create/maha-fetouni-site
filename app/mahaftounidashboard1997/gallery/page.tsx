'use client'
import { useState, useEffect } from 'react'
import { db } from '@/lib/firebase'
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc } from 'firebase/firestore'
import toast from 'react-hot-toast'
import { Trash2, Plus, Eye, EyeOff } from 'lucide-react'

type Photo = {
  id: string
  imageUrl: string
  isPublished: boolean
  createdAt?: any
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

  useEffect(() => {
    fetchPhotos()
  }, [])

  const fetchPhotos = async () => {
    try {
      const snapshot = await getDocs(collection(db, 'photos'))
      const list = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as Photo))
      setPhotos(list)
    } catch (error) {
      toast.error('تعذر جلب الصور')
    } finally {
      setLoading(false)
    }
  }

  const openUploadWidget = () => {
    if (!cloudName) {
      toast.error('Cloudinary غير مهيأ')
      return
    }
    if (typeof window === 'undefined' || !(window as any).cloudinary) {
      toast.error('سكربت Cloudinary لم يتم تحميله بعد')
      return
    }

    const widget = (window as any).cloudinary.createUploadWidget(
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
      async (error: any, result: any) => {
        if (error) {
          toast.error('خطأ في الرفع: ' + JSON.stringify(error))
          return
        }
        if (result && result.event === 'success') {
          setUploading(true)
          try {
            await addDoc(collection(db, 'photos'), {
              imageUrl: result.info.secure_url,
              isPublished: true,
              createdAt: new Date(),
            })
            toast.success('تمت إضافة الصورة')
            fetchPhotos()
          } catch (err) {
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
    } catch (error) {
      toast.error('تعذر التحديث')
    }
  }

  const handleDelete = async (id: string) => {
    if (confirm('حذف هذه الصورة؟')) {
      try {
        await deleteDoc(doc(db, 'photos', id))
        toast.success('تم الحذف')
        fetchPhotos()
      } catch (error) {
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
              <img
                src={photo.imageUrl}
                alt="صورة"
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