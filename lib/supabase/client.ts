import { createBrowserClient } from "@supabase/ssr"

function getSupabaseUrl(): string {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  console.log("[v0] Supabase URL:", url || "not found")
  return url || ""
}

function getSupabaseAnonKey(): string {
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  console.log("[v0] Supabase Key length:", key?.length || 0)
  return key || ""
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
    companies: [
      {
        id: "f44f079e-1779-446d-9194-199994111111",
        name: "Akwaaba HR Pay",
        logo_url: null,
        divisions: ["Head Office", "Regional Office"],
        departments: ["Technology", "Human Resources", "Finance", "Marketing", "Sales", "Operations"],
        locations: ["Accra", "Kumasi", "Takoradi", "Tamale", "Cape Coast"],
      },
    ],
  }

  const createQueryBuilder = (tableName: string) => {
    return {
      select: (columns = "*") => ({
        eq: (column: string, value: any) => ({
          maybeSingle: async () => {
            const tableData = mockData[tableName as keyof typeof mockData] as any[]
            const matchedItem = tableData?.find((item) => item.id === value || item.id.toString() === value.toString())
            return Promise.resolve({
              data: matchedItem || null,
              error: null,
            })
          },
          single: async () => {
            const tableData = mockData[tableName as keyof typeof mockData] as any[]
            const matchedItem = tableData?.find((item) => item.id === value || item.id.toString() === value.toString())
            return Promise.resolve({
              data: matchedItem || null,
              error: null,
            })
          },
          order: (column: string, options?: any) => ({
            limit: async (count: number) => {
              const tableData = mockData[tableName as keyof typeof mockData] as any[]
              return Promise.resolve({
                data: tableData?.slice(0, count) || [],
                error: null,
              })
            },
          }),
        }),
        order: (column: string, options?: any) => ({
          limit: async (count: number) => {
            const tableData = mockData[tableName as keyof typeof mockData] as any[]
            return Promise.resolve({
              data: tableData?.slice(0, count) || [],
              error: null,
            })
          },
        }),
        then: async (callback: any) => {
          const tableData = mockData[tableName as keyof typeof mockData] || []
          return callback({
            data: tableData,
            error: null,
          })
        },
      }),
      insert: (data: any) => ({
        select: () => ({
          single: async () => {
            const newItem = { id: Date.now(), ...data[0] }
            return Promise.resolve({
              data: newItem,
              error: null,
            })
          },
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
      signInWithPassword: () => Promise.resolve({ data: null, error: { message: "Mock Supabase client" } }),
      signUp: () => Promise.resolve({ data: null, error: { message: "Mock Supabase client" } }),
      signOut: () => Promise.resolve({ error: null }),
    },
  }
}

export function createClient() {
  const url = getSupabaseUrl()
  const key = getSupabaseAnonKey()

  if (url && key && url.includes("supabase.co") && !url.includes("your-project") && key.length > 20) {
    try {
      console.log("[v0] Creating real Supabase client")
      return createBrowserClient(url, key)
    } catch (error) {
      console.error("[v0] Failed to create real Supabase client:", error)
    }
  }

  console.log("[v0] Using mock Supabase client")
  return createMockSupabaseClient() as any
}
