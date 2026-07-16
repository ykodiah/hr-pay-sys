import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"
import { createMemoryQueryBuilder, isDemoMode } from "@/lib/demo/memory-db"

function createMockServerClient() {
  return {
    __isMock: true,
    auth: {
      getUser: async () => ({
        data: {
          user: {
            id: "demo-user",
            email: "demo@akwaaba.local",
            app_metadata: {},
            user_metadata: { full_name: "Demo User" },
            aud: "authenticated",
            created_at: new Date().toISOString(),
          },
        },
        error: null,
      }),
      getSession: async () => ({
        data: {
          session: {
            access_token: "demo",
            refresh_token: "demo",
            expires_in: 3600,
            token_type: "bearer",
            user: { id: "demo-user", email: "demo@akwaaba.local" },
          },
        },
        error: null,
      }),
    },
    from: (table: string) => createMemoryQueryBuilder(table),
    rpc: async (fn: string, args?: Record<string, unknown>) => {
      // Soft-success stubs for optional RPCs used by payroll/reports
      if (fn === "issue_payroll_run_payslips" && args?.p_payroll_run_id) {
        const builder = createMemoryQueryBuilder("payslips")
        const { data } = await builder
          .update({ status: "issued", issued_at: new Date().toISOString() })
          .eq("payroll_run_id", args.p_payroll_run_id)
          .eq("status", "draft")
        return { data: { issued: (data ?? []).length, already_issued: 0 }, error: null }
      }
      if (fn === "log_report_action" || fn === "file_compliance_report") {
        return { data: null, error: null }
      }
      return { data: null, error: null }
    },
  }
}

export async function createClient() {
  if (isDemoMode()) {
    return createMockServerClient() as any
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  const cookieStore = await cookies()

  return createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll()
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options))
        } catch {
          // Server Component context — ignore
        }
      },
    },
  })
}

export function isMockSupabaseClient(client: any): boolean {
  return Boolean(client?.__isMock)
}
