import type { Metadata } from 'next'

type Props = { params: Promise<{ slug: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://maha-fetouni-site.vercel.app'
  let song: { titleAr: string; titleEn: string; artistAr: string; artistEn: string; coverImageUrl: string; description: string } | null = null
  if (projectId) {
    try {
      const res = await fetch(`https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/songs/${slug}`, { next: { revalidate: 300 } })
      if (res.ok) {
        const data = await res.json()
        const f = data.fields || {}
        const s = (k: string) => f[k]?.stringValue || ''
        song = {
          titleAr: s('titleAr'), titleEn: s('titleEn'),
          artistAr: s('artistAr') || 'مها فتوني', artistEn: s('artistEn') || 'Maha Ftouni',
          coverImageUrl: s('coverImageUrl'), description: s('descriptionAr') || s('descriptionEn') || '',
        }
      }
    } catch { song = null }
  }
  if (!song) return { title: 'أغنية' }
  const title = song.titleAr || song.titleEn || 'أغنية'
  const artist = song.artistAr || song.artistEn || 'مها فتوني'
  const description = song.description || `اسمعي ${title} للفنانة ${artist} على موقع مها فتوني`
  const url = `${siteUrl}/song/${slug}`
  const cover = song.coverImageUrl || `${siteUrl}/og-cover.jpg`
  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      type: 'music.song', url, title: `${title} - ${artist}`, description,
      images: [{ url: cover, width: 1200, height: 630, alt: title }],
    },
    twitter: {
      card: 'summary_large_image', title: `${title} - ${artist}`, description, images: [cover],
    },
  }
}

export default function SongAliasLayout({ children }: { children: React.ReactNode }) {
  return children
}
