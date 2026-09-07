import { db } from './firebase'
import { collection, addDoc } from 'firebase/firestore'

export async function logAnalyticsEvent(
  type: 'page_view' | 'song_play' | 'song_like' | 'photo_view' | 'contact_submit',
  data: Record<string, any> = {}
) {
  try {
    await addDoc(collection(db, 'analytics_events'), {
      type,
      ...data,
      timestamp: new Date(),
    })
  } catch (error) {
    console.error('Error logging analytics:', error)
  }
}