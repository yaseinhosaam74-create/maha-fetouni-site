'use client'
import { useCallback, useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import type { User } from 'firebase/auth'
import { onAuthStateChanged, signOut, signInWithEmailAndPassword } from 'firebase/auth'
import { doc, getDoc, serverTimestamp, setDoc } from 'firebase/firestore'
import { Music, Camera, Mail, Settings, LogOut, Sun, Moon, Languages, Eye, EyeOff, BarChart3, Search } from 'lucide-react'
import toast from 'react-hot-toast'
import { auth, db } from '@/lib/firebase'
import { useTheme } from '@/components/ThemeContext'

const OWNER_ADMIN_EMAIL = 'yaseinhosaam74@gmail.com'

type AdminIdentity = {
  uid: string
  email: string
  roleFound: string
  adminDocExists: boolean
}

function normalizeEmail(value: string): string {
  return value.trim().toLowerCase()
}

function hasAdminRole(value: unknown): boolean {
  return value === 'admin' || value === true
}

async function resolveAdmin(user: User): Promise<{ isAdmin: boolean; identity: AdminIdentity }> {
  const uid = user.uid
  const email = normalizeEmail(user.email || '')
  const isOwner = email === OWNER_ADMIN_EMAIL
  const adminRef = doc(db, 'admins', uid)
  const adminDoc = await getDoc(adminRef)
  const adminDocExists = adminDoc.exists()
  const adminData = adminDocExists ? adminDoc.data() : null
  const roleFound = String(adminData?.role ?? adminData?.admin ?? '')
  let isAdmin = hasAdminRole(adminData?.role) || hasAdminRole(adminData?.admin)

  if (!isAdmin && isOwner) {
    await setDoc(adminRef, {
      uid,
      email,
      role: 'admin',
      admin: true,
      promotedAt: serverTimestamp(),
    }, { merge: true })
    isAdmin = true
  }

  return {
    isAdmin,
    identity: { uid, email, roleFound, adminDocExists },
  }
}

export default function AdminShell({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [lang, setLang] = useState<'ar' | 'en'>('ar')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loginLoading, setLoginLoading] = useState(false)
  const pathname = usePathname()
  const { theme, toggleTheme } = useTheme()
  const isDark = theme === 'dark'
  const authGeneration = useRef(0)
  const pendingSignIn = useRef<Promise<User | null> | null>(null)

  const approveUser = useCallback((nextUser: User | null, identity: AdminIdentity) => {
    console.log('[AdminAuth] permission', { uid: identity.uid, email: identity.email, roleFound: identity.roleFound, adminDocExists: identity.adminDocExists })
    if (nextUser) {
      setUser(nextUser)
      return
    }
    console.warn('[AdminAuth] access denied', identity)
    setUser(null)
    void signOut(auth)
  }, [])

  useEffect(() => {
    let cancelled = false
    const unsubscribe = onAuthStateChanged(auth, (authUser) => {
      const generation = ++authGeneration.current
      if (cancelled) return

      if (!authUser) {
        setUser(null)
        setLoading(false)
        return
      }

      if (pendingSignIn.current) {
        void pendingSignIn.current.then((resolved) => {
          if (cancelled || generation !== authGeneration.current) return
          if (!resolved) return
          setUser(resolved)
          setLoading(false)
        })
        return
      }

      void (async () => {
        try {
          const { isAdmin, identity } = await resolveAdmin(authUser)
          if (cancelled || generation !== authGeneration.current) return
          if (isAdmin) {
            approveUser(authUser, identity)
          } else {
            approveUser(null, identity)
          }
        } catch (err) {
          if (cancelled || generation !== authGeneration.current) return
          console.error('[AdminAuth] check failed', err)
          setUser(null)
          await signOut(auth)
        } finally {
          if (!cancelled && generation === authGeneration.current) setLoading(false)
        }
      })()
    })
    return () => {
      cancelled = true
      unsubscribe()
    }
  }, [approveUser])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoginLoading(true)
    try {
      const credential = await signInWithEmailAndPassword(auth, email.trim().toLowerCase(), password)
      const signedInUser = credential.user
      const signInResult = (async () => {
        const generation = ++authGeneration.current
        try {
          const { isAdmin, identity } = await resolveAdmin(signedInUser)
          if (generation !== authGeneration.current) return null
          if (!isAdmin) {
            approveUser(null, identity)
            toast.error(lang === 'ar' ? `ليس لديك صلاحية دخول (${identity.email || 'no-email'})` : `No admin access (${identity.email || 'no-email'})`)
            return null
          }
          approveUser(signedInUser, identity)
          toast.success(lang === 'ar' ? 'مرحباً بك' : 'Welcome')
          return signedInUser
        } catch (err) {
          if (generation !== authGeneration.current) return null
          console.error('[AdminAuth] login check failed', err)
          setUser(null)
          await signOut(auth)
          toast.error(lang === 'ar' ? 'تعذر التحقق من الصلاحية' : 'Could not verify access')
          return null
        } finally {
          setLoading(false)
        }
      })()
      pendingSignIn.current = signInResult
      await signInResult
      pendingSignIn.current = null
    } catch (err) {
      console.error('[AdminAuth] login failed', err)
      const msg = err instanceof Error ? err.message : 'Invalid credentials'
      toast.error(lang === 'ar' ? `فشل الدخول: ${msg}` : `Login failed: ${msg}`)
    } finally {
      setLoginLoading(false)
    }
  }

  const handleLogout = async () => {
    await signOut(auth)
    toast.success(lang === 'ar' ? 'تم تسجيل الخروج' : 'Logged out')
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-camel-coat">
        {lang === 'ar' ? 'جارٍ التحميل...' : 'Loading...'}
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-italian-roast">
        <form onSubmit={handleLogin} className="bg-tamarind p-8 rounded-lg shadow-lg w-full max-w-md">
          <h1 className="text-2xl font-bold text-camel-coat mb-6 text-center">
            {lang === 'ar' ? 'لوحة تحكم مها فتوني' : 'Maha Fetouni Dashboard'}
          </h1>
          <div className="mb-4">
            <label className="block text-camel-coat mb-2">
              {lang === 'ar' ? 'البريد الإلكتروني' : 'Email'}
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full p-3 rounded bg-italian-roast text-camel-coat border border-boho focus:outline-none"
              required
            />
          </div>
          <div className="mb-6">
            <label className="block text-camel-coat mb-2">
              {lang === 'ar' ? 'كلمة المرور' : 'Password'}
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full p-3 rounded bg-italian-roast text-camel-coat border border-boho focus:outline-none pr-12"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-boho hover:text-camel-coat transition"
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </div>
          <button
            type="submit"
            disabled={loginLoading}
            className="w-full bg-rubine text-white py-3 rounded hover:bg-tamarind transition disabled:opacity-50"
          >
            {loginLoading ? (lang === 'ar' ? 'جارٍ الدخول...' : 'Logging in...') : lang === 'ar' ? 'دخول' : 'Login'}
          </button>
          <div className="mt-4 text-center">
            <button
              type="button"
              onClick={() => setLang(lang === 'ar' ? 'en' : 'ar')}
              className="text-boho hover:text-camel-coat transition flex items-center justify-center gap-1"
            >
              <Languages size={16} />
              {lang === 'ar' ? 'English' : 'العربية'}
            </button>
          </div>
        </form>
      </div>
    )
  }

  const menuItems = [
    { href: '/mahaftounidashboard1997', label: 'Dashboard', icon: BarChart3 },
    { href: '/mahaftounidashboard1997/songs', label: lang === 'ar' ? 'الأغاني' : 'Songs', icon: Music },
    { href: '/mahaftounidashboard1997/gallery', label: lang === 'ar' ? 'المعرض' : 'Gallery', icon: Camera },
    { href: '/mahaftounidashboard1997/messages', label: lang === 'ar' ? 'الرسائل' : 'Messages', icon: Mail },
    { href: '/mahaftounidashboard1997/settings', label: lang === 'ar' ? 'الإعدادات' : 'Settings', icon: Settings },
    { href: '/mahaftounidashboard1997/seo', label: 'SEO', icon: Search },
  ]

  return (
    <div className={`min-h-screen flex ${isDark ? 'bg-italian-roast text-camel-coat' : 'bg-white text-gray-900'}`}>
      <aside className={`w-64 shrink-0 ${isDark ? 'bg-tamarind' : 'bg-gray-100'} p-6 flex flex-col gap-6`}>
        <h2 className="text-xl font-bold mb-4">
          {lang === 'ar' ? 'لوحة التحكم' : 'Dashboard'}
        </h2>
        <nav className="flex flex-col gap-2">
          {menuItems.map((item) => {
            const isActive = pathname === item.href
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition ${
                  isActive ? 'bg-rubine text-white' : 'hover:bg-rubine/30'
                }`}
              >
                <item.icon size={18} />
                {item.label}
              </Link>
            )
          })}
        </nav>
        <div className="mt-auto flex flex-col gap-2">
          <button
            onClick={toggleTheme}
            className="flex items-center gap-2 px-4 py-2 rounded-lg hover:bg-rubine/30 transition"
          >
            {isDark ? <Sun size={18} /> : <Moon size={18} />}
            {isDark ? (lang === 'ar' ? 'وضع فاتح' : 'Light Mode') : (lang === 'ar' ? 'وضع داكن' : 'Dark Mode')}
          </button>
          <button
            onClick={() => setLang(lang === 'ar' ? 'en' : 'ar')}
            className="flex items-center gap-2 px-4 py-2 rounded-lg hover:bg-rubine/30 transition"
          >
            <Languages size={18} />
            {lang === 'ar' ? 'English' : 'العربية'}
          </button>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 px-4 py-2 rounded-lg hover:bg-rubine/30 transition text-red-500"
          >
            <LogOut size={18} />
            {lang === 'ar' ? 'تسجيل الخروج' : 'Logout'}
          </button>
        </div>
      </aside>
      <main className="flex-1 p-8 overflow-y-auto">{children}</main>
    </div>
  )
}
