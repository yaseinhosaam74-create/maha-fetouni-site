'use client'
import React, { createContext, useContext, useEffect } from 'react'
import { useLocalStorage } from '@/lib/useLocalStorage'

type Theme = 'dark' | 'light'

type ThemeContextType = {
  theme: Theme
  toggleTheme: () => void
  setTheme: (theme: Theme) => void
}

const ThemeContext = createContext<ThemeContextType | null>(null)

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [storedTheme, setStoredTheme] = useLocalStorage('theme', 'dark')
  const theme: Theme = storedTheme === 'light' ? 'light' : 'dark'

  useEffect(() => {
    document.body.classList.remove('dark', 'light')
    document.body.classList.add(theme)
    if (theme === 'dark') {
      document.body.style.backgroundColor = '#280B0F'
      document.body.style.color = '#C6B39A'
    } else {
      document.body.style.backgroundColor = '#ffffff'
      document.body.style.color = '#280B0F'
    }
  }, [theme])

  const changeTheme = (newTheme: Theme) => {
    setStoredTheme(newTheme)
  }

  const toggleTheme = () => {
    changeTheme(theme === 'dark' ? 'light' : 'dark')
  }

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, setTheme: changeTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}

export const useTheme = () => {
  const context = useContext(ThemeContext)
  if (!context) throw new Error('useTheme must be used within ThemeProvider')
  return context
}
