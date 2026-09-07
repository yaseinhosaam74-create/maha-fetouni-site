import { db } from './firebase'
import { collection, getDocs, doc, getDoc, query, where, deleteDoc, setDoc } from 'firebase/firestore'

export type Song = {
  id: string
  titleAr: string
  titleEn: string
  artistAr?: string
  artistEn?: string
  audioUrl: string
  coverImageUrl: string
  albumAr?: string
  albumEn?: string
  year?: number
  composerAr?: string
  composerEn?: string
  lyricistAr?: string
  lyricistEn?: string
  arrangerAr?: string
  arrangerEn?: string
  lyricsAr?: string
  lyricsEn?: string
  isPublished: boolean
  plays: number
  likes: number
  createdAt?: any
}

export type Photo = {
  id: string
  imageUrl: string
  isPublished: boolean
  createdAt?: any
}

export async function getPublishedSongs(): Promise<Song[]> {
  const songsRef = collection(db, 'songs')
  const q = query(songsRef, where('isPublished', '==', true))
  const snapshot = await getDocs(q)
  return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as Song))
}

export async function getSongById(id: string): Promise<Song | null> {
  const docRef = doc(db, 'songs', id)
  const docSnap = await getDoc(docRef)
  if (docSnap.exists() && docSnap.data().isPublished) {
    return { id: docSnap.id, ...docSnap.data() } as Song
  }
  return null
}

export async function getPublishedPhotos(): Promise<Photo[]> {
  const photosRef = collection(db, 'photos')
  const q = query(photosRef, where('isPublished', '==', true))
  const snapshot = await getDocs(q)
  return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as Photo))
}

export async function getAllPhotos(): Promise<Photo[]> {
  const photosRef = collection(db, 'photos')
  const snapshot = await getDocs(photosRef)
  return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as Photo))
}

export async function getSiteSettings() {
  const docRef = doc(db, 'settings', 'site_settings')
  const docSnap = await getDoc(docRef)
  if (docSnap.exists()) {
    return docSnap.data()
  }
  return null
}

// ============ دوال الإعجابات ============

// إعجاب بأغنية معينة من جهاز معين
export async function likeSong(songId: string, deviceId: string) {
  const likeRef = doc(db, 'likes', `${deviceId}_${songId}`)
  await setDoc(likeRef, {
    deviceId,
    songId,
    createdAt: new Date(),
  })
  // تحديث العداد في الأغنية
  const songRef = doc(db, 'songs', songId)
  const songSnap = await getDoc(songRef)
  if (songSnap.exists()) {
    const currentLikes = songSnap.data().likes || 0
    await setDoc(songRef, { likes: currentLikes + 1 }, { merge: true })
  }
}

// إلغاء إعجاب بأغنية من جهاز معين
export async function unlikeSong(songId: string, deviceId: string) {
  const likeRef = doc(db, 'likes', `${deviceId}_${songId}`)
  await deleteDoc(likeRef)
  // تحديث العداد في الأغنية
  const songRef = doc(db, 'songs', songId)
  const songSnap = await getDoc(songRef)
  if (songSnap.exists()) {
    const currentLikes = songSnap.data().likes || 0
    await setDoc(songRef, { likes: Math.max(0, currentLikes - 1) }, { merge: true })
  }
}

// التحقق مما إذا كان الجهاز قد أعجب بالأغنية
export async function isSongLiked(songId: string, deviceId: string): Promise<boolean> {
  const likeRef = doc(db, 'likes', `${deviceId}_${songId}`)
  const likeSnap = await getDoc(likeRef)
  return likeSnap.exists()
}

// جلب جميع الإعجابات لأغنية معينة
export async function getSongLikes(songId: string): Promise<number> {
  const likesRef = collection(db, 'likes')
  const q = query(likesRef, where('songId', '==', songId))
  const snapshot = await getDocs(q)
  return snapshot.size
}