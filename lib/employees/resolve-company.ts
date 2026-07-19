import type { SupabaseClient } from "@supabase/supabase-js"

/**
 * Resolve the working company_id for payroll/HR modules.
 * Prefer the authenticated user's employee / profile / JWT metadata.
 * Fail closed — never falls back to an arbitrary first companies row.
 */
export async function resolveCompanyId(
  client: SupabaseClient,
  userId?: string | null,
  userMeta?: { email?: string | null; app_metadata?: any; user_metadata?: any } | null,
): Promise<{ companyId: string; companyName?: string } | null> {
  const fromMeta =
    userMeta?.app_metadata?.company_id || userMeta?.user_metadata?.company_id || null
  if (typeof fromMeta === "string" && fromMeta.trim()) {
    const companyId = fromMeta.trim()
    const { data: company } = await client
      .from("companies")
      .select("id, name")
      .eq("id", companyId)
      .maybeSingle()
    if (company?.id) return { companyId: company.id, companyName: company.name }
  }

  if (userId) {
    const { data: byId } = await client
      .from("employees")
      .select("company_id, companies:company_id(name)")
      .eq("id", userId)
      .maybeSingle()

    if (byId?.company_id) {
      const company = Array.isArray(byId.companies) ? byId.companies[0] : byId.companies
      return { companyId: byId.company_id, companyName: company?.name }
    }

    // Some deployments link auth user via employee_profiles
    const { data: profile } = await client
      .from("employee_profiles")
      .select("employee_id")
      .eq("id", userId)
      .maybeSingle()

    if (profile?.employee_id) {
      const { data: emp } = await client
        .from("employees")
        .select("company_id, companies:company_id(name)")
        .eq("id", profile.employee_id)
        .maybeSingle()
      if (emp?.company_id) {
        const company = Array.isArray(emp.companies) ? emp.companies[0] : emp.companies
        return { companyId: emp.company_id, companyName: company?.name }
      }
    }

    if (userMeta?.email) {
      const { data: byEmail } = await client
        .from("employees")
        .select("company_id, companies:company_id(name)")
        .or(`corporate_email.eq.${userMeta.email},personal_email.eq.${userMeta.email}`)
        .limit(1)
        .maybeSingle()
      if (byEmail?.company_id) {
        const company = Array.isArray(byEmail.companies) ? byEmail.companies[0] : byEmail.companies
        return { companyId: byEmail.company_id, companyName: company?.name }
      }
    }
  }

  return null
}
