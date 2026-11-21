'use client'
import { useEffect } from 'react'

const selector = 'main, section, div, article, footer, header, img, p, h1, h2, h3, button, a'

export default function AutoScrollReveal() {
  useEffect(() => {
    const observer =
      typeof IntersectionObserver === 'undefined'
        ? null
        : new IntersectionObserver(
            (entries) => {
              entries.forEach((entry) => {
                if (entry.isIntersecting) {
                  entry.target.classList.add('auto-reveal-visible')
                  observer?.unobserve(entry.target)
                }
              })
            },
            { threshold: 0.05 }
          )

    const reveal = (element: Element) => {
      if (element.closest('[data-no-reveal]') || element.closest('.fixed') || element.classList.contains('no-reveal') || element.classList.contains('auto-reveal')) {
        return
      }
      if (!observer) {
        element.classList.add('auto-reveal', 'auto-reveal-visible')
        return
      }
      element.classList.add('auto-reveal')
      observer.observe(element)
    }

    document.querySelectorAll(selector).forEach(reveal)

    const mutationObserver =
      typeof MutationObserver === 'undefined'
        ? null
        : new MutationObserver((records) => {
            records.forEach((record) => {
              record.addedNodes.forEach((node) => {
                if (!(node instanceof Element)) return
                if (node.matches(selector)) reveal(node)
                node.querySelectorAll(selector).forEach(reveal)
              })
            })
          })

    mutationObserver?.observe(document.body, { childList: true, subtree: true })

    return () => {
      observer?.disconnect()
      mutationObserver?.disconnect()
    }
  }, [])

  return null
}
