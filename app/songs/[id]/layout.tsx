import type { Metadata } from 'next'

type Props = { params: Promise<{ id: string }>; children: React.ReactNode }

async function getSong(id: string) {
  const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID
  if (!projectId) return null
  try {
    const res = await fetch(`https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/songs/${id}`, { next: { revalidate: 300 } })
    if (!res.ok) return null
    const data = await res.json()
    const f = data.fields || {}
    const s = (k: string) => f[k]?.stringValue || ''
    return {
      titleAr: s('titleAr'), titleEn: s('titleEn'),
      artistAr: s('artistAr') || 'مهى فتوني', artistEn: s('artistEn') || 'Maha Ftouni',
      coverImageUrl: s('coverImageUrl'), description: s('descriptionAr') || s('descriptionEn') || '',
    }
  } catch { return null }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params
  const song = await getSong(id)
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://maha-ftouni.com'
  if (!song) return { title: 'أغنية' }
  const title = song.titleAr || song.titleEn || 'أغنية'
  const artist = song.artistAr || song.artistEn || 'مهى فتوني'
  const description = song.description || `استمع إلى ${title} للفنانة ${artist}`
  const url = `${siteUrl}/songs/${id}`
  return {
    title,
    description,
    openGraph: { type: 'music.song', url, title: `${title} - ${artist}`, description, images: song.coverImageUrl ? [{ url: song.coverImageUrl }] : [] },
    twitter: { card: 'summary_large_image', title: `${title} - ${artist}`, description, images: song.coverImageUrl ? [song.coverImageUrl] : [] },
  }
}

export default function SongLayout({ children }: { children: React.ReactNode }) {
  return children
}
