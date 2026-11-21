export type CoverPalette = {
  dominant: string
  palette: string[]
}

const FALLBACK_PALETTE: CoverPalette = {
  dominant: '#7B2D2D',
  palette: ['#7B2D2D', '#C6B39A', '#280B0F'],
}

const paletteCache = new Map<string, CoverPalette>()

function toHex(value: number): string {
  return Math.max(0, Math.min(255, Math.round(value))).toString(16).padStart(2, '0')
}

export async function getCoverPalette(url: string): Promise<CoverPalette> {
  if (!url || typeof window === 'undefined') return FALLBACK_PALETTE

  const cached = paletteCache.get(url)
  if (cached) return cached

  try {
    const image = new window.Image()
    image.crossOrigin = 'anonymous'
    image.src = url
    await new Promise<void>((resolve, reject) => {
      image.onload = () => resolve()
      image.onerror = () => reject(new Error('cover load failed'))
    })

    const canvas = document.createElement('canvas')
    canvas.width = 32
    canvas.height = 32
    const context = canvas.getContext('2d')
    if (!context) return FALLBACK_PALETTE
    context.drawImage(image, 0, 0, 32, 32)

    const pixels = context.getImageData(0, 0, 32, 32).data
    const buckets = new Map<string, { count: number; r: number; g: number; b: number }>()

    for (let index = 0; index < pixels.length; index += 16) {
      const alpha = pixels[index + 3]
      if (alpha < 128) continue
      const r = pixels[index]
      const g = pixels[index + 1]
      const b = pixels[index + 2]
      const key = `${r >> 4}-${g >> 4}-${b >> 4}`
      const bucket = buckets.get(key) ?? { count: 0, r: 0, g: 0, b: 0 }
      bucket.count += 1
      bucket.r += r
      bucket.g += g
      bucket.b += b
      buckets.set(key, bucket)
    }

    const colors = Array.from(buckets.values())
      .sort((a, b) => b.count - a.count)
      .slice(0, 3)
      .map((bucket) => {
        const count = Math.max(1, bucket.count)
        return `#${toHex(bucket.r / count)}${toHex(bucket.g / count)}${toHex(bucket.b / count)}`
      })

    if (colors.length === 0) return FALLBACK_PALETTE
    while (colors.length < 3) colors.push(colors[colors.length - 1])

    const palette = { dominant: colors[0], palette: colors }
    paletteCache.set(url, palette)
    return palette
  } catch {
    return FALLBACK_PALETTE
  }
}
