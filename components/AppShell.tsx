'use client'
import { usePathname } from 'next/navigation'
import { Toaster } from 'react-hot-toast'
import { AudioProvider, useAudio } from '@/components/AudioContext'
import FullScreenPlayer from '@/components/FullScreenPlayer'
import DynamicBackground from '@/components/DynamicBackground'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import ServiceWorkerRegister from '@/components/ServiceWorkerRegister'
import CursorEffect from '@/components/CursorEffect'
import ForgetMessage from '@/components/ForgetMessage'
import AutoScrollReveal from '@/components/AutoScrollReveal'
import SEOManager from '@/components/SEOManager'
import AnalyticsTracker from '@/components/AnalyticsTracker'
import { LanguageProvider } from '@/app/context/LanguageContext'
import { ThemeProvider } from '@/components/ThemeContext'

export default function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      <LanguageProvider>
        <AudioProvider>
          <AppShellContent>{children}</AppShellContent>
        </AudioProvider>
      </LanguageProvider>
    </ThemeProvider>
  )
}

function AppShellContent({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const { isFullscreenPlayerOpen } = useAudio()
  const isAdminRoute = pathname.startsWith('/mahaftounidashboard1997')
  const isPhotoViewer = pathname.startsWith('/gallery/photo')
  const isFullscreen = isPhotoViewer
  const showChrome = !isAdminRoute && !isFullscreen

  return (
    <>
      <div className={isFullscreenPlayerOpen ? 'invisible pointer-events-none' : ''}>
        {showChrome && <DynamicBackground />}
        {showChrome && <Header />}
        <main className={`flex-1 ${showChrome ? 'pb-28' : ''} page-enter`}>{children}</main>
        {showChrome && <Footer />}
        {showChrome && <ServiceWorkerRegister />}
        {showChrome && <CursorEffect />}
        {showChrome && <ForgetMessage />}
        {showChrome && <AutoScrollReveal />}
        {showChrome && <SEOManager />}
        {showChrome && <AnalyticsTracker />}
      </div>
      {isFullscreenPlayerOpen && <FullScreenPlayer />}
      <Toaster position="bottom-center" />
    </>
  )
}
