import type { Metadata, Viewport } from 'next'
import { Cairo } from 'next/font/google'
import './globals.css'
import AppShell from '@/components/AppShell'

const cairo = Cairo({
  subsets: ['arabic'],
  weight: ['300', '400', '500', '600', '700'],
  variable: '--font-cairo',
})

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://maha-fetouni-site.vercel.app'
const siteTitle = 'مها فتوني | Maha Ftouni'
const siteDescription = 'اسمعي أغاني مها فتوني - الموقع الرسمي لأغاني وصور وكلمات مها فتوني'

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: siteTitle,
    template: '%s | مها فتوني',
  },
  description: siteDescription,
  applicationName: 'مها فتوني',
  keywords: ['مها فتوني', 'Maha Ftouni', 'اغاني', 'لبنان'],
  openGraph: {
    type: 'website',
    locale: 'ar_AR',
    url: siteUrl,
    siteName: 'مها فتوني',
    title: siteTitle,
    description: siteDescription,
    images: [{ url: `${siteUrl}/icons/icon-512x512.png`, width: 512, height: 512, alt: siteTitle }],
  },
  twitter: {
    card: 'summary_large_image',
    title: siteTitle,
    description: siteDescription,
    images: [`${siteUrl}/icons/icon-512x512.png`],
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
