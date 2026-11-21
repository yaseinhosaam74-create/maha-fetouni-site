import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'نبذة',
  description: 'تعرف على السيرة الذاتية للمطربة مهى فتوني',
}

export default function AboutLayout({ children }: { children: React.ReactNode }) {
  return children
}
