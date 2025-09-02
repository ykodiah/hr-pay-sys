import { createBrowserClient } from "@supabase/ssr"

export function createClient() {
  const supabaseUrl =
    process.env.NEXT_PUBLIC_SUPABASE_URL ||
    (typeof window !== "undefined" && (window as any).NEXT_PUBLIC_SUPABASE_URL) ||
    "https://supabase-pink-apple.supabase.co"

  const supabaseAnonKey =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    (typeof window !== "undefined" && (window as any).NEXT_PUBLIC_SUPABASE_ANON_KEY) ||
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN1cGFiYXNlLXBpbmstYXBwbGUiLCJyb2xlIjoiYW5vbiIsImlhdCI6MTczNTc3NjAwMCwiZXhwIjoyMDUxMzUyMDAwfQ.placeholder"

  console.log("[v0] Supabase URL available:", !!supabaseUrl)
  console.log("[v0] Supabase Key available:", !!supabaseAnonKey)

  if (!supabaseUrl || !supabaseAnonKey) {
    console.error("[v0] Missing Supabase environment variables")
    throw new Error("Missing Supabase environment variables")
  }

  return createBrowserClient(supabaseUrl, supabaseAnonKey)
}
