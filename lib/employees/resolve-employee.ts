import type { SupabaseClient } from "@supabase/supabase-js"

/**
 * Resolve the employees row for the authenticated user within a company.
 * Never assumes employees.id === auth.uid.
 */
export async function resolveEmployeeForUser(
  client: SupabaseClient,
  opts: {
    userId: string
    email?: string | null
    companyId?: string | null
  },
): Promise<any | null> {
  const { userId, email, companyId } = opts

  try {
    const { data: profile } = await client
      .from("employee_profiles")
      .select("employee_id")
      .eq("id", userId)
      .maybeSingle()
    if (profile?.employee_id) {
      let q = client.from("employees").select("*").eq("id", profile.employee_id)
      if (companyId) q = q.eq("company_id", companyId)
      const { data } = await q.maybeSingle()
      if (data) return data
    }
  } catch {
    // optional
  }

  // Some deployments use employees.id = auth.uid()
  try {
    let q = client.from("employees").select("*").eq("id", userId)
    if (companyId) q = q.eq("company_id", companyId)
    const { data } = await q.maybeSingle()
    if (data) return data
  } catch {
    // ignore
  }

  if (email) {
    try {
      let q = client
        .from("employees")
        .select("*")
        .or(`corporate_email.eq.${email},personal_email.eq.${email},email.eq.${email}`)
      if (companyId) q = q.eq("company_id", companyId)
      const { data } = await q.limit(1).maybeSingle()
      if (data) return data
    } catch {
      // ignore
    }
  }

  return null
}
