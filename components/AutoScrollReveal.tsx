'use client'
import { useEffect } from 'react'

export default function AutoScrollReveal() {
  useEffect(() => {
    const elements = document.querySelectorAll('main, section, div, article, footer, header, img, p, h1, h2, h3, button, a')

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('auto-reveal-visible')
            observer.unobserve(entry.target)
          }
        })
      },
      { threshold: 0.05 }
    )

    elements.forEach((el) => {
      if (!el.closest('[data-no-reveal]') && !el.closest('.fixed') && !el.classList.contains('no-reveal')) {
        el.classList.add('auto-reveal')
        observer.observe(el)
      }
    })

    return () => observer.disconnect()
  }, [])

  return null
}