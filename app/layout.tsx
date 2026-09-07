'use client'
import { Cairo } from 'next/font/google'
import './globals.css'
import { AudioProvider } from '@/components/AudioContext'
import DynamicBackground from '@/components/DynamicBackground'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import ServiceWorkerRegister from '@/components/ServiceWorkerRegister'
import CursorEffect from '@/components/CursorEffect'
import ForgetMessage from '@/components/ForgetMessage'
import AutoScrollReveal from '@/components/AutoScrollReveal'
import SEOManager from '@/components/SEOManager'
import AnalyticsTracker from '@/components/AnalyticsTracker'
import { Toaster } from 'react-hot-toast'
import { LanguageProvider } from '@/app/context/LanguageContext'
import { ThemeProvider } from '@/components/ThemeContext'
import { usePathname } from 'next/navigation'

const cairo = Cairo({
  subsets: ['arabic'],
  weight: ['300', '400', '500', '600', '700'],
  variable: '--font-cairo',
})

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const isAdminRoute = pathname.startsWith('/mahaftounidashboard1997')
  const isPhotoViewer = pathname.startsWith('/gallery/photo')
  const isFullscreen = isPhotoViewer

  return (
    <html lang="ar" dir="rtl" className={cairo.variable} suppressHydrationWarning>
      <body className="font-arabic bg-italian-roast text-camel-coat min-h-screen flex flex-col" suppressHydrationWarning>
        <ThemeProvider>
          <LanguageProvider>
            <AudioProvider>
              {!isAdminRoute && !isFullscreen && <DynamicBackground />}
              {!isAdminRoute && !isFullscreen && <Header />}
              <main className={`flex-1 ${!isAdminRoute && !isFullscreen ? 'pb-28' : ''} page-enter`}>
                {children}
              </main>
              {!isAdminRoute && !isFullscreen && <Footer />}
              <Toaster position="bottom-center" />
              <ServiceWorkerRegister />
              {!isAdminRoute && !isFullscreen && <CursorEffect />}
              {!isAdminRoute && !isFullscreen && <ForgetMessage />}
              {!isAdminRoute && !isFullscreen && <AutoScrollReveal />}
              {!isAdminRoute && !isFullscreen && <SEOManager />}
              {!isAdminRoute && !isFullscreen && <AnalyticsTracker />}
            </AudioProvider>
          </LanguageProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}