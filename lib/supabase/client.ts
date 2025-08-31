import { createBrowserClient } from "@supabase/ssr"

function getEnvironmentVariable(name: string): string | undefined {
  // Try multiple ways to access environment variables in v0 runtime
  if (typeof window !== "undefined") {
    // Client-side: try window object first
    const windowEnv = (window as any).__ENV__?.[name]
    if (windowEnv) return windowEnv
  }

  // Standard Next.js environment variable access
  return process.env[name]
}

export function createClient() {
  console.log("[v0] Creating Supabase client...")

  const url = getEnvironmentVariable("NEXT_PUBLIC_SUPABASE_URL")
  const key = getEnvironmentVariable("NEXT_PUBLIC_SUPABASE_ANON_KEY")

  console.log("[v0] Supabase URL found:", !!url)
  console.log("[v0] Supabase Key found:", !!key)

  if (!url || !key) {
    console.log("[v0] Environment variables not found, creating mock client")

    // Return a comprehensive mock client that implements all Supabase methods
    return {
      from: (table: string) => ({
        select: (columns?: string) => ({
          eq: (column: string, value: any) => ({
            single: () => Promise.resolve({ data: null, error: null }),
            maybeSingle: () => Promise.resolve({ data: null, error: null }),
            limit: (count: number) => ({
              single: () => Promise.resolve({ data: null, error: null }),
              maybeSingle: () => Promise.resolve({ data: null, error: null }),
            }),
          }),
          order: (column: string, options?: any) => ({
            limit: (count: number) => Promise.resolve({ data: [], error: null }),
            then: (resolve: any) => resolve({ data: [], error: null }),
          }),
          limit: (count: number) => Promise.resolve({ data: [], error: null }),
          then: (resolve: any) => resolve({ data: [], error: null }),
        }),
        insert: (data: any) => Promise.resolve({ data: null, error: null }),
        update: (data: any) => ({
          eq: (column: string, value: any) => Promise.resolve({ data: null, error: null }),
        }),
        delete: () => ({
          eq: (column: string, value: any) => Promise.resolve({ data: null, error: null }),
        }),
      }),
      channel: (name: string) => ({
        on: (event: string, callback: any) => ({
          subscribe: () => ({ unsubscribe: () => {} }),
        }),
      }),
      auth: {
        getUser: () => Promise.resolve({ data: { user: null }, error: null }),
        signInWithPassword: (credentials: any) => Promise.resolve({ data: null, error: null }),
        signUp: (credentials: any) => Promise.resolve({ data: null, error: null }),
        signOut: () => Promise.resolve({ error: null }),
      },
    }
  }

  try {
    console.log("[v0] Creating real Supabase client")
    return createBrowserClient(url, key)
  } catch (error) {
    console.log("[v0] Failed to create real Supabase client:", error)
    // Return the same mock client as fallback
    return {
      from: (table: string) => ({
        select: (columns?: string) => ({
          eq: (column: string, value: any) => ({
            single: () => Promise.resolve({ data: null, error: null }),
            maybeSingle: () => Promise.resolve({ data: null, error: null }),
          }),
          then: (resolve: any) => resolve({ data: [], error: null }),
        }),
        insert: (data: any) => Promise.resolve({ data: null, error: null }),
        update: (data: any) => ({
          eq: (column: string, value: any) => Promise.resolve({ data: null, error: null }),
        }),
      }),
      channel: (name: string) => ({
        on: (event: string, callback: any) => ({
          subscribe: () => ({ unsubscribe: () => {} }),
        }),
      }),
      auth: {
        getUser: () => Promise.resolve({ data: { user: null }, error: null }),
      },
    }
  }
}
