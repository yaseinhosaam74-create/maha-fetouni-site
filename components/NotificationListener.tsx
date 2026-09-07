'use client'
import { useEffect } from 'react'
import toast from 'react-hot-toast'
import { checkNewSongs } from '@/lib/notifications'

export default function NotificationListener() {
  useEffect(() => {
    const check = async () => {
      const count = await checkNewSongs()
      if (count > 0) {
        toast.success(`هناك ${count} أغنية جديدة! استمع الآن`, {
          duration: 5000,
          position: 'top-center',
        })
      }
    }
    check()
  }, [])

  return null
}