import { createBrowserClient } from "@supabase/ssr"

export function createClient() {
  console.log("[v0] Environment variables check:", {
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    allEnvKeys: Object.keys(process.env).filter((key) => key.includes("SUPABASE")),
  })

  // Try multiple environment variable patterns
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY

  console.log("[v0] Resolved Supabase config:", {
    url: supabaseUrl ? "Found" : "Missing",
    key: supabaseAnonKey ? "Found" : "Missing",
  })

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error(`Missing Supabase environment variables: URL=${!!supabaseUrl}, KEY=${!!supabaseAnonKey}`)
  }

  return createBrowserClient(supabaseUrl, supabaseAnonKey)
}
