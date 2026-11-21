import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'الأغاني',
  description: 'استمع إلى جميع أغاني مهى فتوني',
}

export default function SongsLayout({ children }: { children: React.ReactNode }) {
  return children
}
