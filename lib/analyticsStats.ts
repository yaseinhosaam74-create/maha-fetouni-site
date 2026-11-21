import { db } from './firebase'
import { collection, getDocs, limit, query, type DocumentData } from 'firebase/firestore'
import type { AnalyticsEventData } from './analytics'

const ANALYTICS_EVENTS_LIMIT = 1000

type AnalyticsEvent = AnalyticsEventData & {
  type?: string
  event?: string
  page?: string
}

function toAnalyticsEvent(data: DocumentData): AnalyticsEvent {
  return {
    type: typeof data.type === 'string' ? data.type : typeof data.event === 'string' ? data.event : undefined,
    path: typeof data.path === 'string' ? data.path : typeof data.page === 'string' ? data.page : undefined,
    songId: typeof data.songId === 'string' ? data.songId : undefined,
    photoId: typeof data.photoId === 'string' ? data.photoId : undefined,
  }
}

export type AnalyticsSummary = {
  totalPageViews: number
  pageViewsByPath: Record<string, number>
  totalSongPlays: number
  songPlaysById: Record<string, number>
  totalSongLikes: number
  totalPhotos: number
  totalSongs: number
  totalMessages: number
  unreadMessages: number
}

export async function getAnalyticsSummary(): Promise<AnalyticsSummary> {
  const eventsQuery = query(
    collection(db, 'analytics_events'),
    limit(ANALYTICS_EVENTS_LIMIT)
  )
  const eventsSnap = await getDocs(eventsQuery)
  const events = eventsSnap.docs.map((doc) => toAnalyticsEvent(doc.data()))

  const summary: AnalyticsSummary = {
    totalPageViews: 0,
    pageViewsByPath: {},
    totalSongPlays: 0,
    songPlaysById: {},
    totalSongLikes: 0,
    totalPhotos: 0,
    totalSongs: 0,
    totalMessages: 0,
    unreadMessages: 0,
  }

  events.forEach((event) => {
    switch (event.type) {
      case 'page_view': {
        summary.totalPageViews++
        const path = event.path || 'unknown'
        summary.pageViewsByPath[path] = (summary.pageViewsByPath[path] ?? 0) + 1
        break
      }
      case 'song_play': {
        summary.totalSongPlays++
        if (event.songId) {
          summary.songPlaysById[event.songId] = (summary.songPlaysById[event.songId] ?? 0) + 1
        }
        break
      }
      case 'song_like':
        summary.totalSongLikes++
        break
    }
  })

  const photosSnap = await getDocs(collection(db, 'photos'))
  summary.totalPhotos = photosSnap.size

  const songsSnap = await getDocs(collection(db, 'songs'))
  summary.totalSongs = songsSnap.size
  // يمكن أيضًا جمع plays وlikes من حقول الأغاني إن أردت، لكن نعتمد على الأحداث

  const messagesSnap = await getDocs(collection(db, 'messages'))
  summary.totalMessages = messagesSnap.size
  summary.unreadMessages = messagesSnap.docs.filter((doc) => !doc.data().read).length

  return summary
}