import type { SupabaseClient } from "@supabase/supabase-js"

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

function isUuid(value: unknown): value is string {
  return typeof value === "string" && UUID_RE.test(value.trim())
}

async function loadCompany(
  client: SupabaseClient,
  companyId: string,
): Promise<{ companyId: string; companyName?: string } | null> {
  if (!isUuid(companyId)) return null
  const { data: company } = await client
    .from("companies")
    .select("id, name")
    .eq("id", companyId)
    .maybeSingle()
  if (!company?.id) return null
  return { companyId: company.id, companyName: company.name }
}

/**
 * Resolve the working company_id for payroll/HR modules.
 * Prefer the authenticated user's employee / profile / JWT metadata.
 * Accepts seed RPC UUID when that company row exists.
 * Single-company fallback only when exactly one company exists.
 */
export async function resolveCompanyId(
  client: SupabaseClient,
  userId?: string | null,
  userMeta?: { email?: string | null; app_metadata?: any; user_metadata?: any } | null,
): Promise<{ companyId: string; companyName?: string } | null> {
  // 1) users.company_id
  if (userId) {
    try {
      const { data: profile } = await client.from("users").select("company_id").eq("id", userId).maybeSingle()
      if (profile?.company_id) {
        const found = await loadCompany(client, profile.company_id)
        if (found) return found
      }
    } catch {
      // optional
    }
  }

  // 2) JWT / user metadata
  const fromMeta =
    userMeta?.app_metadata?.company_id ||
    userMeta?.user_metadata?.company_id ||
    userMeta?.app_metadata?.companyId ||
    userMeta?.user_metadata?.companyId ||
    null
  if (typeof fromMeta === "string" && fromMeta.trim()) {
    const found = await loadCompany(client, fromMeta.trim())
    if (found) return found
  }

  if (userId) {
    // 3) employees.id = auth user
    const { data: byId } = await client
      .from("employees")
      .select("company_id, companies:company_id(name)")
      .eq("id", userId)
      .maybeSingle()

    if (byId?.company_id) {
      const company = Array.isArray(byId.companies) ? byId.companies[0] : byId.companies
      return { companyId: byId.company_id, companyName: company?.name }
    }

    // 4) employee_profiles → employees
    try {
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
    } catch {
      // optional
    }
  }

  const email = (userMeta?.email || "").trim()
  if (email) {
    // 5) employees by email
    try {
      const { data: byEmail } = await client
        .from("employees")
        .select("company_id, companies:company_id(name)")
        .or(`corporate_email.eq.${email},personal_email.eq.${email},email.eq.${email}`)
        .not("company_id", "is", null)
        .limit(1)
        .maybeSingle()
      if (byEmail?.company_id) {
        const company = Array.isArray(byEmail.companies) ? byEmail.companies[0] : byEmail.companies
        return { companyId: byEmail.company_id, companyName: company?.name }
      }
    } catch {
      // ignore
    }

    // 6) companies contact email
    try {
      const { data: byCompanyEmail } = await client
        .from("companies")
        .select("id, name")
        .or(`email_address.eq.${email},email.eq.${email}`)
        .limit(1)
        .maybeSingle()
      if (byCompanyEmail?.id) {
        return { companyId: byCompanyEmail.id, companyName: byCompanyEmail.name }
      }
    } catch {
      // ignore
    }
  }

  // 7) RPC — accept if company exists (including seed UUID environments)
  try {
    const { data: rpcId } = await client.rpc("get_current_user_company_id")
    if (typeof rpcId === "string") {
      const found = await loadCompany(client, rpcId.trim())
      if (found) return found
    }
  } catch {
    // optional
  }

  // 8) Single-tenant fallback
  try {
    const { data: companies, error } = await client
      .from("companies")
      .select("id, name")
      .order("created_at", { ascending: true })
      .limit(2)
    if (!error && Array.isArray(companies) && companies.length === 1 && companies[0]?.id) {
      return { companyId: companies[0].id, companyName: companies[0].name }
    }
  } catch {
    // ignore
  }

  return null
}
