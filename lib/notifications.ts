import { db } from './firebase'
import { collection, getDocs, query, where } from 'firebase/firestore'

export async function checkNewSongs() {
  try {
    const q = query(collection(db, 'songs'), where('isPublished', '==', true))
    const snapshot = await getDocs(q)
    const songs = snapshot.docs.map((doc) => doc.id)
    const stored = localStorage.getItem('knownSongs')
    const knownSongs = stored ? JSON.parse(stored) : []

    const newSongs = songs.filter((id) => !knownSongs.includes(id))

    if (newSongs.length > 0) {
      // تحديث القائمة المعروفة
      localStorage.setItem('knownSongs', JSON.stringify(songs))
      return newSongs.length
    }

    // إذا لم توجد أغانٍ معروفة مسبقًا (أول زيارة)، خزّن القائمة الحالية
    localStorage.setItem('knownSongs', JSON.stringify(songs))
    return 0
  } catch (error) {
    console.error('Error checking new songs:', error)
    return 0
  }
}