import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'المعرض',
  description: 'شاهد صور مهى فتوني',
}

export default function GalleryLayout({ children }: { children: React.ReactNode }) {
  return children
}
