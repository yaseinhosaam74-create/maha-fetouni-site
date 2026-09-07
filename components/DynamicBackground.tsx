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
