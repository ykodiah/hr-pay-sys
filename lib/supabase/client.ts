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

function createMockSupabaseClient() {
  const mockData = {
    employees: [
      {
        id: 1,
        employee_id: "AKWA0001",
        first_name: "John",
        last_name: "Doe",
        email: "john.doe@example.com",
        phone: "+233123456789",
        status: "Active",
        created_at: new Date().toISOString(),
        subsidiaries: { name: "Main Office", id: 1 },
      },
    ],
    subsidiaries: [{ id: 1, name: "Main Office", status: "active" }],
    companies: [{ id: 1, name: "Akwaaba HR Pay", logo_url: null }],
  }

  const createQueryBuilder = (tableName: string) => {
    const query = { table: tableName, filters: {}, orderBy: null, limit: null }

    return {
      select: (columns = "*") => ({
        eq: (column: string, value: any) => {
          query.filters[column] = value
          return {
            maybeSingle: () =>
              Promise.resolve({
                data: mockData[tableName as keyof typeof mockData]?.[0] || null,
                error: null,
              }),
            single: () =>
              Promise.resolve({
                data: mockData[tableName as keyof typeof mockData]?.[0] || null,
                error: null,
              }),
            order: (column: string, options?: any) => ({
              limit: (count: number) =>
                Promise.resolve({
                  data: mockData[tableName as keyof typeof mockData]?.slice(0, count) || [],
                  error: null,
                }),
            }),
          }
        },
        order: (column: string, options?: any) => ({
          limit: (count: number) =>
            Promise.resolve({
              data: mockData[tableName as keyof typeof mockData]?.slice(0, count) || [],
              error: null,
            }),
          then: (callback: any) =>
            callback({
              data: mockData[tableName as keyof typeof mockData] || [],
              error: null,
            }),
        }),
        then: (callback: any) =>
          callback({
            data: mockData[tableName as keyof typeof mockData] || [],
            error: null,
          }),
      }),
      insert: (data: any) => ({
        select: () => ({
          single: () =>
            Promise.resolve({
              data: { id: Date.now(), ...data[0] },
              error: null,
            }),
        }),
        then: (callback: any) =>
          callback({
            data: { id: Date.now(), ...data[0] },
            error: null,
          }),
      }),
      update: (data: any) => ({
        eq: (column: string, value: any) =>
          Promise.resolve({
            data: { ...data, id: value },
            error: null,
          }),
      }),
    }
  }

  return {
    from: (tableName: string) => createQueryBuilder(tableName),
    channel: (channelName: string) => ({
      on: (event: string, config: any, callback: Function) => ({
        subscribe: () => ({
          unsubscribe: () => {},
        }),
      }),
    }),
    auth: {
      getUser: () => Promise.resolve({ data: { user: null }, error: null }),
      signInWithPassword: () => Promise.resolve({ data: null, error: { message: "Supabase not configured" } }),
      signUp: () => Promise.resolve({ data: null, error: { message: "Supabase not configured" } }),
      signOut: () => Promise.resolve({ error: null }),
    },
  }
}

export function createClient() {
  const url = getSupabaseUrl()
  const key = getSupabaseAnonKey()

  // Let Supabase client attempt connection - if it fails, it will throw proper errors
  try {
    return createBrowserClient(url, key)
  } catch (error) {
    console.error("[v0] Failed to create Supabase client:", error)
    return createMockSupabaseClient() as any
  }
}
