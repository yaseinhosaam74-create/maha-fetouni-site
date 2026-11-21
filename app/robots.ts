import type { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://maha-ftouni.com'
  return {
    rules: [
      { userAgent: '*', allow: '/', disallow: ['/mahaftounidashboard1997', '/api/'] },
    ],
    sitemap: `${siteUrl}/sitemap.xml`,
  }
}
