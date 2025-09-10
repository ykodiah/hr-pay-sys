import { createBrowserClient } from "@supabase/ssr"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL

const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

export function createClient() {
  console.log("[v0] Client - Environment check:", {
    url: !!supabaseUrl,
    key: !!supabaseAnonKey,
    processEnv:
      typeof process !== "undefined" ? Object.keys(process.env || {}).filter((k) => k.includes("SUPABASE")) : [],
  })

  if (!supabaseUrl || !supabaseAnonKey) {
    console.error("[v0] Supabase environment variables missing:", {
      url: !!supabaseUrl,
      key: !!supabaseAnonKey,
    })

    // Return a mock client that throws helpful errors
    return {
      from: () => ({
        select: () => Promise.reject(new Error("Supabase client not configured - missing environment variables")),
        insert: () => Promise.reject(new Error("Supabase client not configured - missing environment variables")),
        update: () => Promise.reject(new Error("Supabase client not configured - missing environment variables")),
        delete: () => Promise.reject(new Error("Supabase client not configured - missing environment variables")),
      }),
      auth: {
        getUser: () => Promise.reject(new Error("Supabase client not configured - missing environment variables")),
        signInWithPassword: () =>
          Promise.reject(new Error("Supabase client not configured - missing environment variables")),
        signOut: () => Promise.reject(new Error("Supabase client not configured - missing environment variables")),
      },
    } as any
  }

  return createBrowserClient(supabaseUrl, supabaseAnonKey)
}
