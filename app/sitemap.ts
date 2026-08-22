import type { MetadataRoute } from "next"
import { blogPosts } from "@/lib/marketing/blog"

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://akwaabahr.com"
  const pages = [
    ["", 1, "weekly"], ["/features", 0.9, "weekly"], ["/features/security", 0.8, "monthly"], ["/solutions", 0.9, "weekly"],
    ["/industries", 0.85, "weekly"], ["/faq", 0.85, "weekly"], ["/blog", 0.8, "weekly"], ["/about", 0.7, "monthly"], ["/contact", 0.7, "monthly"],
    ["/privacy", 0.4, "yearly"], ["/terms", 0.4, "yearly"],
  ] as const
  return [
    ...pages.map(([path, priority, changeFrequency]) => ({ url: `${baseUrl}${path}`, lastModified: new Date(), changeFrequency, priority })),
    ...blogPosts.map((post) => ({ url: `${baseUrl}/blog/${post.slug}`, lastModified: new Date(post.published), changeFrequency: "monthly" as const, priority: 0.7 })),
  ]
}
