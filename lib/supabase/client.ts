import { createBrowserClient } from "@supabase/ssr"

export function createClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  console.log("[v0] Supabase client initialization:", {
    hasUrl: !!supabaseUrl,
    hasKey: !!supabaseAnonKey,
    urlLength: supabaseUrl?.length || 0,
    keyLength: supabaseAnonKey?.length || 0,
  })

  if (!supabaseUrl || !supabaseAnonKey) {
    console.error("[v0] Missing Supabase environment variables:", {
      NEXT_PUBLIC_SUPABASE_URL: !!supabaseUrl,
      NEXT_PUBLIC_SUPABASE_ANON_KEY: !!supabaseAnonKey,
    })

    // Throw a more descriptive error
    throw new Error(
      `Supabase configuration error: Missing ${!supabaseUrl ? "NEXT_PUBLIC_SUPABASE_URL" : ""} ${!supabaseAnonKey ? "NEXT_PUBLIC_SUPABASE_ANON_KEY" : ""}. Please check your environment variables.`,
    )
  }

  return createBrowserClient(supabaseUrl, supabaseAnonKey)
}
