import type { MetadataRoute } from "next"

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://akwaabahr.com"
  return {
    rules: [
      { userAgent: "*", allow: ["/", "/features", "/solutions", "/blog", "/about", "/contact", "/privacy", "/terms"], disallow: ["/app/", "/api/", "/superadmin/", "/self-service/", "/setup"] },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  }
}
