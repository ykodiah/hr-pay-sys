import { createBrowserClient } from "@supabase/ssr"

export function createClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || globalThis.process?.env?.NEXT_PUBLIC_SUPABASE_URL

  const supabaseKey =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || globalThis.process?.env?.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseKey) {
    console.error("[v0] Supabase environment variables not found:", {
      url: !!supabaseUrl,
      key: !!supabaseKey,
    })
    throw new Error("Supabase environment variables are required")
  }

  return createBrowserClient(supabaseUrl, supabaseKey)
}
