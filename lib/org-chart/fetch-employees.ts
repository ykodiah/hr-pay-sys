import type { SupabaseClient } from "@supabase/supabase-js"
import { ACTIVE_EMPLOYEE_STATUSES } from "@/lib/employees/status"
import type { OrgEmployee } from "@/lib/org-chart/builder"

const PAGE_SIZE = 1000

const EMPLOYEE_SELECT =
  "id, first_name, last_name, full_name, display_name, position, department, subsidiary_id, direct_supervisor, head_of_department, special_role, employee_id"

/** Paginate past Supabase's default ~1000 row cap. */
export async function fetchAllOrgEmployees(
  client: SupabaseClient,
  companyId: string,
): Promise<{ employees: OrgEmployee[]; error: string | null }> {
  const employees: OrgEmployee[] = []
  let from = 0

  for (;;) {
    const { data, error } = await client
      .from("employees")
      .select(EMPLOYEE_SELECT)
      .eq("company_id", companyId)
      .in("status", [...ACTIVE_EMPLOYEE_STATUSES])
      .order("id", { ascending: true })
      .range(from, from + PAGE_SIZE - 1)

    if (error) return { employees, error: error.message }
    const batch = (data ?? []) as OrgEmployee[]
    employees.push(...batch)
    if (batch.length < PAGE_SIZE) break
    from += PAGE_SIZE
  }

  return { employees, error: null }
}
