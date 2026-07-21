import { createClient, type SupabaseClient } from "@supabase/supabase-js"

/** Lazy service-role client. Safe during `next build` when env is unset. */
export function getSuperadminDb(): SupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://placeholder.supabase.co"
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || "placeholder-service-role-key"
  return createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
}

export function slugify(input: string): string {
  return String(input || "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60)
}
