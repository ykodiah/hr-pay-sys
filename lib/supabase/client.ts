import { createBrowserClient } from "@supabase/ssr"
import { createMemoryQueryBuilder, isDemoMode } from "@/lib/demo/memory-db"

function createMockClient() {
  return {
    __isMock: true,
    auth: {
      getUser: async () => ({
        data: {
          user: {
            id: "demo-user",
            email: "demo@akwaaba.local",
          },
        },
        error: null,
      }),
      getSession: async () => ({
        data: {
          session: {
            access_token: "demo",
            user: { id: "demo-user", email: "demo@akwaaba.local" },
          },
        },
        error: null,
      }),
      signInWithPassword: async () => ({
        data: {
          user: { id: "demo-user", email: "demo@akwaaba.local" },
          session: { access_token: "demo", user: { id: "demo-user" } },
        },
        error: null,
      }),
      signOut: async () => ({ error: null }),
      onAuthStateChange: () => ({
        data: { subscription: { unsubscribe: () => undefined } },
      }),
    },
    from: (table: string) => createMemoryQueryBuilder(table),
    rpc: async () => ({ data: null, error: null }),
  }
}

export function createClient() {
  if (isDemoMode()) {
    // Shared in-memory DB so browser company lookup + server APIs stay in sync in demos
    return createMockClient() as ReturnType<typeof createBrowserClient>
  }

  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  )
}
