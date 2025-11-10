import { createBrowserClient } from "@supabase/ssr"

/**
 * Creates a Supabase client configured for client-side use.
 * This client is safe to use in Client Components.
 */
export function createClient() {
  return createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)
}
