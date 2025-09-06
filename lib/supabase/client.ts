import { createBrowserClient } from "@supabase/ssr"

export function createClient() {
  console.log("[v0] Supabase URL found:", !!process.env.NEXT_PUBLIC_SUPABASE_URL)
  console.log("[v0] Supabase Key found:", !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!url || !key) {
    console.error("[v0] Missing Supabase environment variables")
    return createBrowserClient(url || "https://placeholder.supabase.co", key || "placeholder-key")
  }

  return createBrowserClient(url, key)
}
