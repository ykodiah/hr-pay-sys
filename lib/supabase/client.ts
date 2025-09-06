import { createBrowserClient } from "@supabase/ssr"

export function createClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  console.log("[v0] Supabase URL found:", !!supabaseUrl)
  console.log("[v0] Supabase Key found:", !!supabaseAnonKey)

  if (!supabaseUrl || !supabaseAnonKey) {
    console.error("[v0] Missing Supabase environment variables")
    return {
      from: () => ({
        select: () => Promise.reject(new Error("Supabase client not configured - missing environment variables")),
        insert: () => Promise.reject(new Error("Supabase client not configured - missing environment variables")),
        update: () => Promise.reject(new Error("Supabase client not configured - missing environment variables")),
        delete: () => Promise.reject(new Error("Supabase client not configured - missing environment variables")),
      }),
      auth: {
        getUser: () => Promise.reject(new Error("Supabase client not configured - missing environment variables")),
      },
    } as any
  }

  return createBrowserClient(supabaseUrl, supabaseAnonKey)
}
