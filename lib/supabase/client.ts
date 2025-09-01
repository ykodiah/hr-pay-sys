import { createBrowserClient } from "@supabase/ssr"

export function createClient() {
  console.log("[v0] Creating Supabase client...")

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  console.log("[v0] Supabase URL found:", !!url)
  console.log("[v0] Supabase Key found:", !!key)

  if (!url || !key) {
    console.log("[v0] Environment variables not found, creating mock client")

    // Return a simplified mock client that properly implements the methods used
    return {
      from: (table: string) => ({
        select: (columns?: string) => ({
          eq: (column: string, value: any) => ({
            single: () => Promise.resolve({ data: null, error: { message: "Mock client - no database connection" } }),
            maybeSingle: () => Promise.resolve({ data: null, error: null }),
          }),
          order: (column: string, options?: any) => Promise.resolve({ data: [], error: null }),
          limit: (count: number) => Promise.resolve({ data: [], error: null }),
        }),
        insert: (data: any) => ({
          select: () => ({
            single: () => Promise.resolve({ data: null, error: { message: "Mock client - no database connection" } }),
          }),
        }),
        update: (data: any) => ({
          eq: (column: string, value: any) =>
            Promise.resolve({ data: null, error: { message: "Mock client - no database connection" } }),
        }),
        delete: () => ({
          eq: (column: string, value: any) => Promise.resolve({ data: null, error: null }),
        }),
      }),
      auth: {
        getUser: () => Promise.resolve({ data: { user: null }, error: null }),
        signInWithPassword: (credentials: any) =>
          Promise.resolve({ data: null, error: { message: "Mock client - no auth" } }),
        signUp: (credentials: any) => Promise.resolve({ data: null, error: { message: "Mock client - no auth" } }),
        signOut: () => Promise.resolve({ error: null }),
      },
    }
  }

  console.log("[v0] Creating real Supabase client")
  return createBrowserClient(url, key)
}
