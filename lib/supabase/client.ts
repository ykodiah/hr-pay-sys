import { createBrowserClient } from "@supabase/ssr"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

const createMockClient = () => {
  const mock: any = {
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
      onAuthStateChange: () => ({
        data: {
          subscription: {
            unsubscribe: () => undefined,
          },
        },
        error: null,
      }),
    },
    storage: {
      from: (bucket: string) => ({
        upload: () => Promise.resolve({ data: null, error: null }),
        download: () => Promise.resolve({ data: null, error: null }),
        remove: () => Promise.resolve({ data: null, error: null }),
      }),
    },
  }

  mock.__isMock = true
  return mock
}

export function createClient() {
  console.log("[v0] Client - Environment check:", {
    url: !!supabaseUrl,
    key: !!supabaseAnonKey,
    urlValue: supabaseUrl ? `${supabaseUrl.substring(0, 20)}...` : "undefined",
    keyValue: supabaseAnonKey ? `${supabaseAnonKey.substring(0, 20)}...` : "undefined",
    processEnv:
      typeof process !== "undefined" ? Object.keys(process.env || {}).filter((k) => k.includes("SUPABASE")) : [],
  })

  if (!supabaseUrl || !supabaseAnonKey || supabaseUrl === "undefined" || supabaseAnonKey === "undefined") {
    console.log("[v0] Supabase environment variables missing, using mock client:", {
      url: !!supabaseUrl,
      key: !!supabaseAnonKey,
      availableEnvVars:
        typeof process !== "undefined" ? Object.keys(process.env || {}).filter((k) => k.includes("SUPABASE")) : [],
    })
    return createMockClient()
  }

  try {
    console.log("[v0] Creating real Supabase client...")
    const client: any = createBrowserClient(supabaseUrl, supabaseAnonKey)
    client.__isMock = false
    console.log("[v0] Real Supabase client created successfully")
    return client
  } catch (error) {
    console.error("[v0] Failed to create Supabase client, falling back to mock client:", error)
    return createMockClient()
  }
}
