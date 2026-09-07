import { db } from './firebase'
import { collection, getDocs } from 'firebase/firestore'

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
  const eventsSnap = await getDocs(collection(db, 'analytics_events'))
  const events = eventsSnap.docs.map((doc) => doc.data())

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

  events.forEach((event: any) => {
    switch (event.type) {
      case 'page_view':
        summary.totalPageViews++
        const path = event.path || 'unknown'
        if (!summary.pageViewsByPath[path]) summary.pageViewsByPath[path] = 0
        summary.pageViewsByPath[path]++
        break
      case 'song_play':
        summary.totalSongPlays++
        if (event.songId) {
          if (!summary.songPlaysById[event.songId]) summary.songPlaysById[event.songId] = 0
          summary.songPlaysById[event.songId]++
        }
        break
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