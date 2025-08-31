import { createBrowserClient } from "@supabase/ssr"

function getSupabaseUrl(): string {
  // Try multiple ways to access the Supabase URL
  const url =
    process.env.NEXT_PUBLIC_SUPABASE_URL ||
    (typeof window !== "undefined" && (window as any).__NEXT_DATA__?.env?.NEXT_PUBLIC_SUPABASE_URL) ||
    "https://your-project.supabase.co" // This will be replaced by the actual URL from integration

  console.log("[v0] Supabase URL:", url)
  return url
}

function getSupabaseAnonKey(): string {
  // Try multiple ways to access the Supabase anon key
  const key =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    (typeof window !== "undefined" && (window as any).__NEXT_DATA__?.env?.NEXT_PUBLIC_SUPABASE_ANON_KEY) ||
    "your-anon-key" // This will be replaced by the actual key from integration

  console.log("[v0] Supabase Key length:", key?.length || 0)
  return key
}

export function createClient() {
  const url = getSupabaseUrl()
  const key = getSupabaseAnonKey()

  if (!url || url === "https://your-project.supabase.co" || !key || key === "your-anon-key") {
    console.error("[v0] Supabase environment variables not properly configured")
    // Return a mock client for development that won't crash the app
    return {
      from: () => ({
        select: () => ({ data: [], error: null }),
        insert: () => ({ data: null, error: { message: "Supabase not configured" } }),
        update: () => ({ data: null, error: { message: "Supabase not configured" } }),
        delete: () => ({ data: null, error: { message: "Supabase not configured" } }),
      }),
      auth: {
        getUser: () => Promise.resolve({ data: { user: null }, error: null }),
        signInWithPassword: () => Promise.resolve({ data: null, error: { message: "Supabase not configured" } }),
        signUp: () => Promise.resolve({ data: null, error: { message: "Supabase not configured" } }),
        signOut: () => Promise.resolve({ error: null }),
      },
    } as any
  }

  return createBrowserClient(url, key)
}
