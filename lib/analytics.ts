import { db } from './firebase'
import { collection, addDoc } from 'firebase/firestore'

export type AnalyticsEventType =
  | 'page_view'
  | 'song_play'
  | 'song_like'
  | 'photo_view'
  | 'contact_submit'

export type AnalyticsEventData = {
  path?: string
  songId?: string
  photoId?: string
  [key: string]: string | number | boolean | null | undefined
}

export async function logAnalyticsEvent(
  type: AnalyticsEventType,
  data: AnalyticsEventData = {}
): Promise<void> {
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