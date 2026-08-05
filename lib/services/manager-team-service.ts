import type { SupabaseClient } from "@supabase/supabase-js"

/**
 * Resolve employees a manager can approve for:
 * - the manager themselves
 * - employees where they are direct_supervisor
 * - employees in departments where they are head_of_department
 */
export async function getTeamEmployeeIds(
  supabase: SupabaseClient,
  companyId: string,
  managerEmployeeId: string,
): Promise<string[]> {
  const ids = new Set<string>([managerEmployeeId])

  const { data: direct } = await supabase
    .from("employees")
    .select("id")
    .eq("company_id", companyId)
    .eq("direct_supervisor", managerEmployeeId)
  for (const r of direct || []) ids.add(String((r as { id: string }).id))

  const { data: depts } = await supabase
    .from("departments")
    .select("id")
    .eq("company_id", companyId)
    .eq("head_of_department", managerEmployeeId)
  const deptIds = (depts || []).map((d) => String((d as { id: string }).id)).filter(Boolean)
  if (deptIds.length) {
    const { data: inDept } = await supabase
      .from("employees")
      .select("id")
      .eq("company_id", companyId)
      .in("department_id", deptIds)
    for (const r of inDept || []) ids.add(String((r as { id: string }).id))
  }

  return [...ids]
}

export async function listTeamMembers(
  supabase: SupabaseClient,
  companyId: string,
  managerEmployeeId: string,
) {
  const ids = await getTeamEmployeeIds(supabase, companyId, managerEmployeeId)
  if (!ids.length) return []
  const { data, error } = await supabase
    .from("employees")
    .select("id, first_name, last_name, employee_id, department, position, status, direct_supervisor, email")
    .eq("company_id", companyId)
    .in("id", ids)
    .order("first_name")
  if (error) throw new Error(error.message)
  return data || []
}

export async function resolveCurrentEmployee(
  supabase: SupabaseClient,
  companyId: string,
  userId?: string | null,
  userEmail?: string | null,
): Promise<{ id: string; first_name?: string; last_name?: string; email?: string } | null> {
  if (!userId && !userEmail) return null

  if (userId) {
    const { data: byUser } = await supabase
      .from("employees")
      .select("id, first_name, last_name, email")
      .eq("company_id", companyId)
      .eq("user_id", userId)
      .maybeSingle()
    if (byUser?.id) return byUser

    // Sometimes employees.id was used as auth link historically
    const { data: byId } = await supabase
      .from("employees")
      .select("id, first_name, last_name, email")
      .eq("company_id", companyId)
      .eq("id", userId)
      .maybeSingle()
    if (byId?.id) return byId
  }

  if (userEmail) {
    const { data: byEmail } = await supabase
      .from("employees")
      .select("id, first_name, last_name, email")
      .eq("company_id", companyId)
      .ilike("email", userEmail)
      .maybeSingle()
    if (byEmail?.id) return byEmail
  }
  return null
}

/** Alias kept for older imports */
export const getManagedEmployeeIds = getTeamEmployeeIds
export const resolveCurrentEmployeeId = async (
  supabase: SupabaseClient,
  companyId: string,
  userId: string,
  userEmail?: string | null,
) => {
  const emp = await resolveCurrentEmployee(supabase, companyId, userId, userEmail)
  return emp?.id || null
}
