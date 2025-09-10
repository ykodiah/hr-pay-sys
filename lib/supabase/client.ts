import { createBrowserClient } from "@supabase/ssr"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY

export function createClient() {
  console.log("[v0] Client - Environment check:", {
    url: !!supabaseUrl,
    key: !!supabaseAnonKey,
    urlValue: supabaseUrl ? `${supabaseUrl.substring(0, 20)}...` : "undefined",
    keyValue: supabaseAnonKey ? `${supabaseAnonKey.substring(0, 20)}...` : "undefined",
    processEnv:
      typeof process !== "undefined" ? Object.keys(process.env || {}).filter((k) => k.includes("SUPABASE")) : [],
  })

  if (!supabaseUrl || !supabaseAnonKey) {
    console.error("[v0] Supabase environment variables missing:", {
      url: !!supabaseUrl,
      key: !!supabaseAnonKey,
      availableEnvVars:
        typeof process !== "undefined" ? Object.keys(process.env || {}).filter((k) => k.includes("SUPABASE")) : [],
    })

    throw new Error(
      "Your project's URL and Key are required to create a Supabase client!\n\nCheck your Supabase project's API settings to find these values\n\nhttps://supabase.com/dashboard/project/_/settings/api",
    )
  }

  return createBrowserClient(supabaseUrl, supabaseAnonKey)
}
