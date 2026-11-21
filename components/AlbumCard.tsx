import Link from 'next/link'
import Image from 'next/image'

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
        <div className="relative aspect-square overflow-hidden">
          <Image
            src={coverImageUrl}
            alt={title}
            fill
            unoptimized
            sizes="(max-width: 768px) 100vw, 33vw"
            className="object-cover group-hover:scale-105 transition duration-500"
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