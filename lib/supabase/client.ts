import { createBrowserClient } from "@supabase/ssr"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

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
    console.log("[v0] Supabase environment variables missing:", {
      url: !!supabaseUrl,
      key: !!supabaseAnonKey,
      availableEnvVars: typeof process !== "undefined" ? Object.keys(process.env || {}) : [],
    })

    return {
      from: (table: string) => ({
        select: (columns?: string) => ({
          single: () => Promise.resolve({ data: null, error: null }),
          order: (column: string, options?: any) => Promise.resolve({ data: [], error: null }),
          eq: (column: string, value: any) => ({
            single: () => Promise.resolve({ data: null, error: null }),
            then: (callback: any) => Promise.resolve({ data: [], error: null }).then(callback),
          }),
          neq: (column: string, value: any) => Promise.resolve({ data: [], error: null }),
          then: (callback: any) => Promise.resolve({ data: [], error: null }).then(callback),
        }),
        insert: (data: any) => Promise.resolve({ data: null, error: null }),
        update: (data: any) => ({
          eq: (column: string, value: any) => Promise.resolve({ data: null, error: null }),
          neq: (column: string, value: any) => Promise.resolve({ data: null, error: null }),
        }),
        delete: () => ({
          eq: (column: string, value: any) => Promise.resolve({ data: null, error: null }),
        }),
      }),
      auth: {
        getUser: () => Promise.resolve({ data: { user: null }, error: null }),
        signInWithPassword: () => Promise.resolve({ data: null, error: null }),
        signUp: () => Promise.resolve({ data: null, error: null }),
        signOut: () => Promise.resolve({ error: null }),
      },
    } as any
  }

  try {
    return createBrowserClient(supabaseUrl, supabaseAnonKey)
  } catch (error) {
    console.error("[v0] Failed to create Supabase client, falling back to demo mode:", error)

    // Return the same mock client as above
    return {
      from: (table: string) => ({
        select: (columns?: string) => ({
          single: () => Promise.resolve({ data: null, error: null }),
          order: (column: string, options?: any) => Promise.resolve({ data: [], error: null }),
          eq: (column: string, value: any) => ({
            single: () => Promise.resolve({ data: null, error: null }),
            then: (callback: any) => Promise.resolve({ data: [], error: null }).then(callback),
          }),
          neq: (column: string, value: any) => Promise.resolve({ data: [], error: null }),
          then: (callback: any) => Promise.resolve({ data: [], error: null }).then(callback),
        }),
        insert: (data: any) => Promise.resolve({ data: null, error: null }),
        update: (data: any) => ({
          eq: (column: string, value: any) => Promise.resolve({ data: null, error: null }),
          neq: (column: string, value: any) => Promise.resolve({ data: null, error: null }),
        }),
        delete: () => ({
          eq: (column: string, value: any) => Promise.resolve({ data: null, error: null }),
        }),
      }),
      auth: {
        getUser: () => Promise.resolve({ data: { user: null }, error: null }),
        signInWithPassword: () => Promise.resolve({ data: null, error: null }),
        signUp: () => Promise.resolve({ data: null, error: null }),
        signOut: () => Promise.resolve({ error: null }),
      },
    } as any
  }
}
