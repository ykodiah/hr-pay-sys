/** Resolve the public site origin for shareable career / apply links. */
export function getPublicSiteOrigin(fallbackOrigin?: string | null): string {
  const fromEnv =
    process.env.NEXT_PUBLIC_SITE_URL ||
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.NEXT_PUBLIC_BASE_URL ||
    ""
  if (fromEnv.trim()) return fromEnv.trim().replace(/\/$/, "")

  if (fallbackOrigin?.trim()) return fallbackOrigin.trim().replace(/\/$/, "")

  if (typeof window !== "undefined" && window.location?.origin) {
    return window.location.origin.replace(/\/$/, "")
  }

  const vercel = process.env.VERCEL_URL?.trim()
  if (vercel) return `https://${vercel.replace(/^https?:\/\//, "")}`.replace(/\/$/, "")

  return ""
}

export function buildJobApplyUrl(shortCode: string, fallbackOrigin?: string | null) {
  const origin = getPublicSiteOrigin(fallbackOrigin)
  const code = String(shortCode || "").trim()
  if (!code) return ""
  if (!origin) return `/j/${encodeURIComponent(code)}`
  return `${origin}/j/${encodeURIComponent(code)}`
}
