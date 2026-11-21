import type { Metadata, Viewport } from 'next'
import { Cairo } from 'next/font/google'
import './globals.css'
import AppShell from '@/components/AppShell'

const cairo = Cairo({
  subsets: ['arabic'],
  weight: ['300', '400', '500', '600', '700'],
  variable: '--font-cairo',
})

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://maha-ftouni.com'

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: 'مهى فتوني | الموقع الرسمي',
    template: '%s | مهى فتوني',
  },
  description: 'الموقع الرسمي للمطربة اللبنانية مهى فتوني - أغاني، صور، كلمات',
  applicationName: 'مهى فتوني',
  keywords: ['مهى فتوني', 'Maha Ftouni', 'اغاني', 'لبنان'],
  openGraph: {
    type: 'website',
    locale: 'ar_AR',
    url: siteUrl,
    siteName: 'مهى فتوني',
    title: 'مهى فتوني | الموقع الرسمي',
    description: 'الموقع الرسمي للمطربة اللبنانية مهى فتوني',
    images: [{ url: `${siteUrl}/og-cover.jpg`, width: 1200, height: 630, alt: 'مهى فتوني' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'مهى فتوني | الموقع الرسمي',
    description: 'الموقع الرسمي للمطربة اللبنانية مهى فتوني',
    images: [`${siteUrl}/og-cover.jpg`],
  },
  robots: { index: true, follow: true },
  icons: { icon: '/favicon.ico' },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#280B0F',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ar" dir="rtl" className={cairo.variable}>
      <body className="font-arabic bg-italian-roast text-camel-coat min-h-screen flex flex-col">
        <AppShell>{children}</AppShell>
      </body>
    </html>
  )
}
