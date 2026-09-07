import { collection, query, where, getDocs } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import PhotoViewer from '@/components/PhotoViewer'

type Photo = {
  id: string
  imageUrl: string
  isPublished: boolean
}

export default async function SinglePhotoPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  const q = query(collection(db, 'photos'), where('isPublished', '==', true))
  const snapshot = await getDocs(q)

  // تحويل البيانات إلى كائنات بسيطة بدون createdAt أو أي خصائص Firestore معقدة
  const photos: Photo[] = snapshot.docs.map((doc) => {
    const data = doc.data()
    return {
      id: doc.id,
      imageUrl: data.imageUrl,
      isPublished: data.isPublished,
    }
  })

  const initialIndex = photos.findIndex((p) => p.id === id)
  const initialPhoto = initialIndex !== -1 ? photos[initialIndex] : null

  return (
    <PhotoViewer
      photos={photos}
      initialIndex={initialIndex !== -1 ? initialIndex : 0}
      initialPhoto={initialPhoto}
    />
  )
}