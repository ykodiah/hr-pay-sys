import { createBrowserClient } from "@supabase/ssr"

export function createClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    console.error("[v0] Supabase environment variables not found:", {
      hasUrl: !!supabaseUrl,
      hasKey: !!supabaseAnonKey,
      url: supabaseUrl ? `${supabaseUrl.substring(0, 20)}...` : "undefined",
      key: supabaseAnonKey ? `${supabaseAnonKey.substring(0, 20)}...` : "undefined",
    })
    throw new Error("Supabase configuration is missing. Please check your environment variables.")
  }

  return createBrowserClient(supabaseUrl, supabaseAnonKey)
}
