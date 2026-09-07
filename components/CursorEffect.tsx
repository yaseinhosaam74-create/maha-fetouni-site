'use client'
import { useEffect, useRef } from 'react'

export default function CursorEffect() {
  const cursorRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const cursor = cursorRef.current
    if (!cursor) return

    let rafId: number | null = null
    let mouseX = -100
    let mouseY = -100

    const updateCursor = () => {
      if (cursor) {
        cursor.style.transform = `translate(${mouseX}px, ${mouseY}px)`
      }
      rafId = requestAnimationFrame(updateCursor)
    }

    const handleMouseMove = (e: MouseEvent) => {
      mouseX = e.clientX
      mouseY = e.clientY
    }

    updateCursor()
    window.addEventListener('mousemove', handleMouseMove)

    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      if (rafId) cancelAnimationFrame(rafId)
    }
  }, [])

  return (
    <div
      ref={cursorRef}
      className="fixed pointer-events-none z-[99999] w-6 h-6 rounded-full bg-rubine opacity-40 mix-blend-difference"
      style={{
        left: '-12px',
        top: '-12px',
        transition: 'transform 0.05s linear',
        filter: 'blur(4px)',
      }}
    />
  )
}