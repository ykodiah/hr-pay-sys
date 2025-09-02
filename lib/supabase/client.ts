import { createBrowserClient } from "@supabase/ssr"

export function createClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  console.log("[v0] Supabase URL found:", !!supabaseUrl)
  console.log("[v0] Supabase Key found:", !!supabaseAnonKey)

  if (!supabaseUrl || !supabaseAnonKey) {
    console.error("[v0] Missing Supabase environment variables")
    // Return a mock client that throws helpful errors
    return {
      auth: {
        getUser: () => Promise.resolve({ data: { user: null }, error: new Error("Supabase not configured") }),
      },
      from: () => {
        throw new Error("Supabase client not properly configured - missing environment variables")
      },
    } as any
  }

  return createBrowserClient(supabaseUrl, supabaseAnonKey)
}
