#!/bin/bash

# إنشاء المجلدات
mkdir -p components
mkdir -p app/api/init
mkdir -p app/mahaftounidashboard1997/login
mkdir -p app/mahaftounidashboard1997/songs
mkdir -p app/mahaftounidashboard1997/albums
mkdir -p app/mahaftounidashboard1997/messages
mkdir -p app/mahaftounidashboard1997/settings
mkdir -p app/songs/[id]
mkdir -p app/gallery/[albumId]
mkdir -p public

# ================ المكونات ================

# AudioContext.tsx
cat > components/AudioContext.tsx << 'EOF'
'use client'
import React, { createContext, useContext, useState, useEffect, useRef } from 'react'

type Song = {
  id: string
  title: string
  audioUrl: string
  coverImageUrl: string
}

type AudioContextType = {
  currentSong: Song | null
  isPlaying: boolean
  playSong: (song: Song) => void
  togglePlay: () => void
}

const AudioContext = createContext<AudioContextType | null>(null)

export function AudioProvider({ children }: { children: React.ReactNode }) {
  const [currentSong, setCurrentSong] = useState<Song | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const audioRef = useRef<HTMLAudioElement | null>(null)

  useEffect(() => {
    if (currentSong) {
      if (!audioRef.current) {
        audioRef.current = new Audio(currentSong.audioUrl)
        audioRef.current.addEventListener('ended', () => setIsPlaying(false))
      } else {
        audioRef.current.src = currentSong.audioUrl
      }
      audioRef.current.play()
      setIsPlaying(true)
    }
  }, [currentSong])

  const playSong = (song: Song) => {
    setCurrentSong(song)
  }

  const togglePlay = () => {
    if (!audioRef.current) return
    if (isPlaying) {
      audioRef.current.pause()
      setIsPlaying(false)
    } else {
      audioRef.current.play()
      setIsPlaying(true)
    }
  }

  return (
    <AudioContext.Provider value={{ currentSong, isPlaying, playSong, togglePlay }}>
      {children}
    </AudioContext.Provider>
  )
}

export const useAudio = () => {
  const context = useContext(AudioContext)
  if (!context) throw new Error('useAudio must be used within AudioProvider')
  return context
}
EOF

# DynamicBackground.tsx
cat > components/DynamicBackground.tsx << 'EOF'
'use client'
import { useAudio } from './AudioContext'

export default function DynamicBackground() {
  const { currentSong } = useAudio()

  if (!currentSong) return null

  return (
    <div
      className="fixed inset-0 -z-10 transition-all duration-1000"
      style={{
        backgroundImage: `url(${currentSong.coverImageUrl})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        filter: 'blur(40px)',
        opacity: 0.5,
      }}
    />
  )
}
EOF

# Header.tsx
cat > components/Header.tsx << 'EOF'
'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, Music, Camera, Info, Mail } from 'lucide-react'

export default function Header() {
  const pathname = usePathname()
  const isActive = (path: string) => pathname === path

  const navItems = [
    { href: '/', label: 'الرئيسية', icon: Home },
    { href: '/songs', label: 'الأغاني', icon: Music },
    { href: '/gallery', label: 'الصور', icon: Camera },
    { href: '/about', label: 'نبذة', icon: Info },
    { href: '/contact', label: 'اتصل بنا', icon: Mail },
  ]

  return (
    <header className="bg-italian-roast/80 backdrop-blur-md sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
        <Link href="/" className="text-2xl font-bold text-camel-coat">
          مهى فتوني
        </Link>
        <nav className="flex gap-6">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-1 px-3 py-2 rounded-full transition ${
                isActive(item.href)
                  ? 'bg-rubine text-white'
                  : 'text-camel-coat hover:bg-tamarind'
              }`}
            >
              <item.icon size={18} />
              <span className="hidden sm:inline">{item.label}</span>
            </Link>
          ))}
        </nav>
      </div>
    </header>
  )
}
EOF

# Footer.tsx
cat > components/Footer.tsx << 'EOF'
import { Facebook, Instagram, Youtube, Twitter, Music2 } from 'lucide-react'

export default function Footer() {
  return (
    <footer className="bg-italian-roast border-t border-tamarind mt-16">
      <div className="max-w-7xl mx-auto px-4 py-8 text-center">
        <p className="text-camel-coat mb-4">تابعوا مهى فتوني على</p>
        <div className="flex justify-center gap-6 mb-6">
          <a href="#" className="text-camel-coat hover:text-rubine transition"><Facebook /></a>
          <a href="#" className="text-camel-coat hover:text-rubine transition"><Instagram /></a>
          <a href="#" className="text-camel-coat hover:text-rubine transition"><Youtube /></a>
          <a href="#" className="text-camel-coat hover:text-rubine transition"><Twitter /></a>
          <a href="#" className="text-camel-coat hover:text-rubine transition"><Music2 /></a>
        </div>
        <p className="text-boho text-sm">© 2024 مهى فتوني - جميع الحقوق محفوظة</p>
      </div>
    </footer>
  )
}
EOF

# AudioPlayer.tsx
cat > components/AudioPlayer.tsx << 'EOF'
'use client'
import { useAudio } from './AudioContext'
import { Play, Pause, X } from 'lucide-react'

export default function AudioPlayer() {
  const { currentSong, isPlaying, togglePlay } = useAudio()

  if (!currentSong) return null

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-italian-roast/95 backdrop-blur-md border-t border-tamarind p-4 z-50">
      <div className="max-w-7xl mx-auto flex items-center gap-4">
        <img
          src={currentSong.coverImageUrl}
          alt={currentSong.title}
          className="w-12 h-12 rounded-lg object-cover"
        />
        <div className="flex-1">
          <p className="text-camel-coat font-semibold">{currentSong.title}</p>
          <p className="text-boho text-sm">مهى فتوني</p>
        </div>
        <button
          onClick={togglePlay}
          className="bg-rubine text-white p-3 rounded-full hover:bg-tamarind transition"
        >
          {isPlaying ? <Pause size={20} /> : <Play size={20} />}
        </button>
      </div>
    </div>
  )
}
EOF

# SongCard.tsx
cat > components/SongCard.tsx << 'EOF'
'use client'
import Link from 'next/link'
import { useAudio } from './AudioContext'
import { Play } from 'lucide-react'

type SongCardProps = {
  id: string
  title: string
  coverImageUrl: string
  audioUrl: string
  year?: number
}

export default function SongCard({ id, title, coverImageUrl, audioUrl, year }: SongCardProps) {
  const { playSong } = useAudio()

  return (
    <div className="bg-tamarind rounded-xl overflow-hidden shadow-lg hover:shadow-xl transition group">
      <div className="relative aspect-square overflow-hidden">
        <img
          src={coverImageUrl}
          alt={title}
          className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
        />
        <button
          onClick={() => playSong({ id, title, coverImageUrl, audioUrl })}
          className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition flex items-center justify-center"
        >
          <Play size={40} className="text-white" />
        </button>
      </div>
      <div className="p-4">
        <Link href={`/songs/${id}`} className="text-camel-coat font-semibold hover:text-rubine transition">
          {title}
        </Link>
        {year && <p className="text-boho text-sm mt-1">{year}</p>}
      </div>
    </div>
  )
}
EOF

# AlbumCard.tsx
cat > components/AlbumCard.tsx << 'EOF'
import Link from 'next/link'

type AlbumCardProps = {
  id: string
  title: string
  coverImageUrl: string
  description?: string
}

export default function AlbumCard({ id, title, coverImageUrl, description }: AlbumCardProps) {
  return (
    <Link href={`/gallery/${id}`} className="block group">
      <div className="bg-tamarind rounded-xl overflow-hidden shadow-lg hover:shadow-xl transition">
        <div className="aspect-square overflow-hidden">
          <img
            src={coverImageUrl}
            alt={title}
            className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
          />
        </div>
        <div className="p-4">
          <h3 className="text-camel-coat font-semibold group-hover:text-rubine transition">{title}</h3>
          {description && <p className="text-boho text-sm mt-1 line-clamp-2">{description}</p>}
        </div>
      </div>
    </Link>
  )
}
EOF

# ================ الصفحات العامة ================

# app/page.tsx (الرئيسية)
cat > app/page.tsx << 'EOF'
import Link from 'next/link'
import { Music, Camera } from 'lucide-react'

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-8 text-center">
      <h1 className="text-5xl md:text-7xl font-bold text-camel-coat mb-4">مهى فتوني</h1>
      <p className="text-xl md:text-2xl text-boho mb-12">المطربة اللبنانية</p>
      <div className="flex flex-col sm:flex-row gap-4">
        <Link
          href="/songs"
          className="flex items-center gap-2 bg-rubine text-white px-8 py-4 rounded-full hover:bg-tamarind transition text-lg"
        >
          <Music size={20} />
          الأغاني
        </Link>
        <Link
          href="/gallery"
          className="flex items-center gap-2 bg-boho text-white px-8 py-4 rounded-full hover:bg-tamarind transition text-lg"
        >
          <Camera size={20} />
          الصور
        </Link>
      </div>
    </main>
  )
}
EOF

# app/songs/page.tsx
cat > app/songs/page.tsx << 'EOF'
export default function SongsPage() {
  return (
    <div className="max-w-7xl mx-auto p-8">
      <h1 className="text-3xl font-bold text-camel-coat mb-8">الأغاني</h1>
      <p className="text-boho">سيتم عرض الأغاني هنا بعد ربط قاعدة البيانات</p>
    </div>
  )
}
EOF

# app/songs/[id]/page.tsx
cat > app/songs/[id]/page.tsx << 'EOF'
export default function SongDetailPage({ params }: { params: { id: string } }) {
  return (
    <div className="max-w-4xl mx-auto p-8">
      <h1 className="text-3xl font-bold text-camel-coat mb-8">تفاصيل الأغنية</h1>
      <p className="text-boho">معرف الأغنية: {params.id}</p>
      <p className="text-boho">سيتم عرض الكلمات والمعلومات هنا لاحقًا</p>
    </div>
  )
}
EOF

# app/gallery/page.tsx
cat > app/gallery/page.tsx << 'EOF'
export default function GalleryPage() {
  return (
    <div className="max-w-7xl mx-auto p-8">
      <h1 className="text-3xl font-bold text-camel-coat mb-8">معرض الصور</h1>
      <p className="text-boho">سيتم عرض الألبومات هنا بعد ربط قاعدة البيانات</p>
    </div>
  )
}
EOF

# app/gallery/[albumId]/page.tsx
cat > app/gallery/[albumId]/page.tsx << 'EOF'
export default function AlbumDetailPage({ params }: { params: { albumId: string } }) {
  return (
    <div className="max-w-7xl mx-auto p-8">
      <h1 className="text-3xl font-bold text-camel-coat mb-8">صور الألبوم</h1>
      <p className="text-boho">معرف الألبوم: {params.albumId}</p>
      <p className="text-boho">سيتم عرض الصور هنا لاحقًا</p>
    </div>
  )
}
EOF

# app/about/page.tsx
cat > app/about/page.tsx << 'EOF'
export default function AboutPage() {
  return (
    <div className="max-w-4xl mx-auto p-8">
      <h1 className="text-3xl font-bold text-camel-coat mb-8">نبذة عن مهى فتوني</h1>
      <p className="text-camel-coat leading-relaxed">
        مهى فتوني هي مطربة لبنانية موهوبة، تتميز بصوتها العذب وأدائها المميز.
        تقدم مجموعة من الأغاني التي تجمع بين الأصالة والحداثة.
      </p>
    </div>
  )
}
EOF

# app/contact/page.tsx
cat > app/contact/page.tsx << 'EOF'
export default function ContactPage() {
  return (
    <div className="max-w-4xl mx-auto p-8">
      <h1 className="text-3xl font-bold text-camel-coat mb-8">اتصل بنا</h1>
      <p className="text-boho">نموذج الاتصال سيظهر هنا لاحقًا</p>
    </div>
  )
}
EOF

# app/not-found.tsx
cat > app/not-found.tsx << 'EOF'
import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-8 text-center">
      <h1 className="text-6xl font-bold text-rubine mb-4">404</h1>
      <p className="text-2xl text-camel-coat mb-8">الصفحة غير موجودة</p>
      <Link
        href="/"
        className="bg-rubine text-white px-8 py-3 rounded-full hover:bg-tamarind transition"
      >
        العودة للرئيسية
      </Link>
    </div>
  )
}
EOF

# ================ لوحة التحكم ================

# app/mahaftounidashboard1997/page.tsx
cat > app/mahaftounidashboard1997/page.tsx << 'EOF'
import Link from 'next/link'
import { Music, Camera, Mail, Settings, BarChart3 } from 'lucide-react'

export default function AdminDashboard() {
  const menuItems = [
    { href: '/mahaftounidashboard1997/songs', label: 'إدارة الأغاني', icon: Music },
    { href: '/mahaftounidashboard1997/albums', label: 'إدارة الألبومات', icon: Camera },
    { href: '/mahaftounidashboard1997/messages', label: 'الرسائل', icon: Mail },
    { href: '/mahaftounidashboard1997/settings', label: 'الإعدادات', icon: Settings },
  ]

  return (
    <div className="max-w-7xl mx-auto p-8">
      <h1 className="text-3xl font-bold text-camel-coat mb-8">لوحة التحكم</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {menuItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="bg-tamarind p-6 rounded-xl hover:bg-rubine transition flex flex-col items-center gap-4"
          >
            <item.icon size={32} className="text-camel-coat" />
            <span className="text-camel-coat font-semibold">{item.label}</span>
          </Link>
        ))}
      </div>
    </div>
  )
}
EOF

# app/mahaftounidashboard1997/login/page.tsx
cat > app/mahaftounidashboard1997/login/page.tsx << 'EOF'
'use client'
import { useState } from 'react'
import { auth } from '@/lib/firebase'
import { signInWithEmailAndPassword } from 'firebase/auth'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'

export default function AdminLogin() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const userCred = await signInWithEmailAndPassword(auth, email, password)
      const token = await userCred.user.getIdTokenResult()
      if (token.claims.admin) {
        router.push('/mahaftounidashboard1997')
      } else {
        toast.error('ليس لديك صلاحية')
        await auth.signOut()
      }
    } catch (error) {
      toast.error('خطأ في تسجيل الدخول')
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <form onSubmit={handleSubmit} className="bg-tamarind p-8 rounded-lg shadow-lg w-full max-w-md">
        <h1 className="text-2xl font-bold text-camel-coat mb-6">تسجيل دخول الأدمن</h1>
        <div className="mb-4">
          <label className="block text-camel-coat mb-2">البريد الإلكتروني</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full p-3 rounded bg-italian-roast text-camel-coat border border-boho focus:outline-none"
            required
          />
        </div>
        <div className="mb-6">
          <label className="block text-camel-coat mb-2">كلمة المرور</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full p-3 rounded bg-italian-roast text-camel-coat border border-boho focus:outline-none"
            required
          />
        </div>
        <button
          type="submit"
          className="w-full bg-rubine text-white py-3 rounded hover:bg-tamarind transition"
        >
          دخول
        </button>
      </form>
    </div>
  )
}
EOF

# app/mahaftounidashboard1997/songs/page.tsx
cat > app/mahaftounidashboard1997/songs/page.tsx << 'EOF'
export default function AdminSongsPage() {
  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold text-camel-coat mb-6">إدارة الأغاني</h1>
      <p className="text-boho">ستظهر هنا واجهة إدارة الأغاني لاحقًا</p>
    </div>
  )
}
EOF

# app/mahaftounidashboard1997/albums/page.tsx
cat > app/mahaftounidashboard1997/albums/page.tsx << 'EOF'
export default function AdminAlbumsPage() {
  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold text-camel-coat mb-6">إدارة الألبومات</h1>
      <p className="text-boho">ستظهر هنا واجهة إدارة الألبومات لاحقًا</p>
    </div>
  )
}
EOF

# app/mahaftounidashboard1997/messages/page.tsx
cat > app/mahaftounidashboard1997/messages/page.tsx << 'EOF'
export default function AdminMessagesPage() {
  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold text-camel-coat mb-6">الرسائل</h1>
      <p className="text-boho">ستظهر هنا رسائل الزوار لاحقًا</p>
    </div>
  )
}
EOF

# app/mahaftounidashboard1997/settings/page.tsx
cat > app/mahaftounidashboard1997/settings/page.tsx << 'EOF'
export default function AdminSettingsPage() {
  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold text-camel-coat mb-6">الإعدادات</h1>
      <p className="text-boho">ستظهر هنا إعدادات الموقع لاحقًا</p>
    </div>
  )
}
EOF

# ================ ملفات الإعداد ================

# next.config.js
cat > next.config.js << 'EOF'
/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
}

module.exports = nextConfig
EOF

# public/manifest.json
cat > public/manifest.json << 'EOF'
{
  "name": "مهى فتوني",
  "short_name": "مهى فتوني",
  "description": "الموقع الرسمي للمطربة اللبنانية مهى فتوني",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#280B0F",
  "theme_color": "#C6B39A",
  "icons": []
}
EOF

echo "✅ تم إنشاء جميع الملفات بنجاح!"
