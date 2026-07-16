import type { SupabaseClient } from "@supabase/supabase-js"

/**
 * Resolve the working company_id for payroll/HR modules.
 * Prefer the authenticated user's employee record, else first companies row.
 */
export async function resolveCompanyId(
  client: SupabaseClient,
  userId?: string | null,
): Promise<{ companyId: string; companyName?: string } | null> {
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
        .select("company_id")
        .eq("id", profile.employee_id)
        .maybeSingle()
      if (emp?.company_id) return { companyId: emp.company_id }
    }
  }

  const { data: company } = await client.from("companies").select("id, name").limit(1).maybeSingle()
  if (company?.id) return { companyId: company.id, companyName: company.name }
  return null
}
