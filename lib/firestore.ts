import { db } from './firebase'
import {
  collection,
  getDocs,
  doc,
  getDoc,
  query,
  where,
  runTransaction,
  type Timestamp,
} from 'firebase/firestore'

type FirestoreDate = Timestamp | Date | null

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
  syncedLyricsAr?: string
  syncedLyricsEn?: string
  lrcUrl?: string
  lrcUrlAr?: string
  lrcUrlEn?: string
  isPublished: boolean
  plays: number
  likes: number
  createdAt?: FirestoreDate
}

export type Photo = {
  id: string
  imageUrl: string
  isPublished: boolean
  createdAt?: FirestoreDate
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

function getLikeRef(songId: string, deviceId: string) {
  return doc(db, 'likes', `${deviceId}_${songId}`)
}

async function setSongLike(
  songId: string,
  deviceId: string,
  liked: boolean
): Promise<void> {
  const likeRef = getLikeRef(songId, deviceId)
  const songRef = doc(db, 'songs', songId)

  await runTransaction(db, async (transaction) => {
    const [likeSnap, songSnap] = await Promise.all([
      transaction.get(likeRef),
      transaction.get(songRef),
    ])

    if (likeSnap.exists() === liked || !songSnap.exists()) {
      return
    }

    if (liked) {
      transaction.set(likeRef, {
        deviceId,
        songId,
        createdAt: new Date(),
      })
    } else {
      transaction.delete(likeRef)
    }

    const rawLikes = songSnap.data().likes
    const currentLikes =
      typeof rawLikes === 'number' && Number.isFinite(rawLikes) ? rawLikes : 0
    transaction.set(
      songRef,
      { likes: Math.max(0, currentLikes + (liked ? 1 : -1)) },
      { merge: true }
    )
  })
}

// إعجاب بأغنية معينة من جهاز معين
export async function likeSong(
  songId: string,
  deviceId: string
): Promise<void> {
  await setSongLike(songId, deviceId, true)
}

// إلغاء إعجاب بأغنية من جهاز معين
export async function unlikeSong(
  songId: string,
  deviceId: string
): Promise<void> {
  await setSongLike(songId, deviceId, false)
}

// التحقق مما إذا كان الجهاز قد أعجب بالأغنية
export async function isSongLiked(
  songId: string,
  deviceId: string
): Promise<boolean> {
  const likeSnap = await getDoc(getLikeRef(songId, deviceId))
  return likeSnap.exists()
}

// جلب جميع الإعجابات لأغنية معينة
export async function getSongLikes(songId: string): Promise<number> {
  const likesRef = collection(db, 'likes')
  const q = query(likesRef, where('songId', '==', songId))
  const snapshot = await getDocs(q)
  return snapshot.size
}
