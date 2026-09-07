import Image from 'next/image'

type OptimizedImageProps = {
  src: string
  alt: string
  width?: number
  height?: number
  className?: string
  sizes?: string
  priority?: boolean
}

export default function OptimizedImage({ src, alt, width = 500, height = 500, className = '', sizes = '100vw', priority = false }: OptimizedImageProps) {
  return (
    <Image
      src={src}
      alt={alt}
      width={width}
      height={height}
      className={className}
      sizes={sizes}
      priority={priority}
      unoptimized={false}
    />
  )
}