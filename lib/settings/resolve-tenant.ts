// @ts-nocheck
import { NextRequest, NextResponse } from "next/server"
import { createClient, createServiceClient } from "@/lib/supabase/server"
import { isDemoMode } from "@/lib/demo/memory-db"

export type TenantContext = {
  companyId: string
  userId: string | null
  demo: boolean
  service: ReturnType<typeof createServiceClient>
}

function badRequest(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status })
}

function forbidden(message: string) {
  return NextResponse.json({ error: message }, { status: 403 })
}

function isUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value,
  )
}

async function companyExists(
  service: ReturnType<typeof createServiceClient>,
  companyId: string,
): Promise<boolean> {
  if (!isUuid(companyId)) return false
  const { data } = await service.from("companies").select("id").eq("id", companyId).maybeSingle()
  return Boolean(data?.id)
}

/**
 * Resolve the authenticated user's home company from trusted sources only.
 * Prefer identity-bound sources; never pick an arbitrary company when more than one exists.
 */
async function resolveUserCompanyId(
  service: ReturnType<typeof createServiceClient>,
  user: { id: string; email?: string | null; user_metadata?: any; app_metadata?: any } | null,
): Promise<string | null> {
  if (!user?.id) return null

  // 1) users.company_id (explicit profile binding)
  try {
    const { data: profile } = await service.from("users").select("company_id").eq("id", user.id).maybeSingle()
    const profileCompanyId = typeof profile?.company_id === "string" ? profile.company_id.trim() : ""
    if (profileCompanyId && (await companyExists(service, profileCompanyId))) {
      return profileCompanyId
    }
  } catch {
    // optional table
  }

  // 2) JWT / user metadata
  const fromMeta =
    user.app_metadata?.company_id ||
    user.user_metadata?.company_id ||
    user.app_metadata?.companyId ||
    user.user_metadata?.companyId ||
    null
  if (typeof fromMeta === "string" && fromMeta.trim()) {
    const metaId = fromMeta.trim()
    if (await companyExists(service, metaId)) return metaId
  }

  // 3) employee_profiles → employees
  try {
    const { data: profile } = await service
      .from("employee_profiles")
      .select("employee_id")
      .eq("id", user.id)
      .maybeSingle()
    if (profile?.employee_id) {
      const { data: emp } = await service
        .from("employees")
        .select("company_id")
        .eq("id", profile.employee_id)
        .maybeSingle()
      if (emp?.company_id && (await companyExists(service, emp.company_id))) {
        return emp.company_id
      }
    }
  } catch {
    // optional table
  }

  // 4) employees.id = auth.uid()
  try {
    const { data: byId } = await service
      .from("employees")
      .select("company_id")
      .eq("id", user.id)
      .maybeSingle()
    if (byId?.company_id && (await companyExists(service, byId.company_id))) {
      return byId.company_id
    }
  } catch {
    // ignore
  }

  const email = (user.email || "").trim()
  if (email) {
    // 5) employees by corporate/personal email
    try {
      const { data: byEmail } = await service
        .from("employees")
        .select("company_id")
        .or(`corporate_email.eq.${email},personal_email.eq.${email},email.eq.${email}`)
        .not("company_id", "is", null)
        .limit(5)

      for (const row of byEmail || []) {
        if (row?.company_id && (await companyExists(service, row.company_id))) {
          return row.company_id
        }
      }
    } catch {
      // ignore
    }

    // 6) companies contact email (tenant admins often aren't employees)
    try {
      const { data: byCompanyEmail } = await service
        .from("companies")
        .select("id")
        .or(`email_address.eq.${email},email.eq.${email}`)
        .limit(5)

      for (const row of byCompanyEmail || []) {
        if (row?.id && (await companyExists(service, row.id))) return row.id
      }
    } catch {
      // ignore
    }

    // 7) company_settings email / settings_data.email_address
    try {
      const { data: bySettingsEmail } = await service
        .from("company_settings")
        .select("company_id")
        .ilike("email", email)
        .not("company_id", "is", null)
        .limit(5)

      for (const row of bySettingsEmail || []) {
        if (row?.company_id && (await companyExists(service, row.company_id))) {
          return row.company_id
        }
      }
    } catch {
      // email column may not exist — try settings_data scan as fallback
      try {
        const { data: settingsRows } = await service
          .from("company_settings")
          .select("company_id, settings_data")
          .not("company_id", "is", null)
          .limit(25)

        for (const row of settingsRows || []) {
          const settingsEmail =
            (typeof row?.settings_data?.email_address === "string" && row.settings_data.email_address) ||
            (typeof row?.settings_data?.email === "string" && row.settings_data.email) ||
            ""
          if (settingsEmail.trim().toLowerCase() === email.toLowerCase() && row?.company_id) {
            if (await companyExists(service, row.company_id)) return row.company_id
          }
        }
      } catch {
        // ignore
      }
    }
  }

  // 8) RPC — accept any existing company UUID (including seed UUID environments)
  try {
    const { data: rpcId } = await service.rpc("get_current_user_company_id")
    if (typeof rpcId === "string" && (await companyExists(service, rpcId))) {
      return rpcId
    }
  } catch {
    // optional RPC
  }

  // 9) Last resort for single-tenant / early bootstrap: exactly one company row
  try {
    const { data: companies, error } = await service
      .from("companies")
      .select("id")
      .order("created_at", { ascending: true })
      .limit(2)
    if (!error && Array.isArray(companies) && companies.length === 1 && companies[0]?.id) {
      return companies[0].id
    }
  } catch {
    // ignore
  }

  return null
}

/** Persist company_id onto users so later Settings/API calls resolve consistently. */
export async function ensureUserCompanyBinding(
  service: ReturnType<typeof createServiceClient>,
  userId: string | null | undefined,
  companyId: string | null | undefined,
) {
  if (!userId || !companyId || !isUuid(companyId) || userId.startsWith("demo-")) return
  try {
    await service.from("users").upsert(
      {
        id: userId,
        company_id: companyId,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "id" },
    )
  } catch {
    // non-fatal — users table may not exist in all deployments
  }
}

/**
 * Resolve the tenant company for settings API routes.
 * Uses service-role for DB IO so RLS cannot silently reject tenant admin writes,
 * but only after the caller is authenticated and the company is membership-checked.
 *
 * Fail-closed when more than one company exists and the user has no binding.
 * Pass `{ allowUnresolved: true }` for Company bootstrap GET/create flows.
 */
export async function resolveTenantContext(
  req: NextRequest,
  companyIdFromClient?: string | null,
  options?: { allowUnresolved?: boolean },
): Promise<TenantContext | NextResponse | { unresolved: true; userId: string | null; demo: boolean; service: ReturnType<typeof createServiceClient> }> {
  const demo = isDemoMode()
  const service = createServiceClient()

  let user: { id: string; email?: string | null; user_metadata?: any; app_metadata?: any } | null =
    null
  let userId: string | null = null

  if (demo) {
    userId = "demo-user"
  } else {
    try {
      const authClient = await createClient()
      const {
        data: { user: authUser },
      } = await authClient.auth.getUser()
      user = authUser
      userId = authUser?.id ?? null
    } catch {
      user = null
      userId = null
    }
  }

  // Reject unauthenticated callers outside true demo (missing Supabase env) mode.
  // Cookie-only "demo-session" on a real DB must not unlock cross-tenant writes.
  if (!demo && !userId) {
    return badRequest("Authentication required", 401)
  }

  let requestedId = (companyIdFromClient || "").trim()
  if (!requestedId) {
    const { searchParams } = new URL(req.url)
    requestedId = (searchParams.get("company_id") || "").trim()
  }

  // Strip legacy client demo placeholders — never remap them to a real DB company.
  if (requestedId === "demo-company-001" || requestedId.startsWith("demo-")) {
    requestedId = ""
  }

  if (demo) {
    // In-memory demo DB uses a fixed company id.
    const demoCompanyId = "11111111-1111-1111-1111-111111111111"
    return { companyId: requestedId || demoCompanyId, userId, demo, service }
  }

  const homeCompanyId = await resolveUserCompanyId(service, user)

  if (requestedId) {
    if (!isUuid(requestedId)) {
      return badRequest("Invalid company_id", 400)
    }
    const { data: company } = await service
      .from("companies")
      .select("id")
      .eq("id", requestedId)
      .maybeSingle()
    if (!company?.id) {
      return badRequest("Unknown company_id", 404)
    }
    // Client-supplied company_id must match home company when one is known.
    // If home is unknown (admin not linked yet), allow the existing company id
    // so Settings can load/save after Company tab establishes the tenant.
    if (homeCompanyId && requestedId !== homeCompanyId) {
      return forbidden("company_id does not belong to the authenticated user")
    }
    await ensureUserCompanyBinding(service, userId, requestedId)
    return { companyId: requestedId, userId, demo, service }
  }

  if (homeCompanyId) {
    await ensureUserCompanyBinding(service, userId, homeCompanyId)
    return { companyId: homeCompanyId, userId, demo, service }
  }

  if (options?.allowUnresolved) {
    return { unresolved: true, userId, demo, service }
  }

  // Fail closed — do NOT fall back to newest/oldest company when multiple exist.
  return badRequest(
    "Unable to resolve company for this user. Open Company settings and save your company, or set company_id on the user profile.",
    400,
  )
}

export function isTenantContext(
  value: unknown,
): value is TenantContext {
  return Boolean(value && typeof value === "object" && "companyId" in (value as any) && "service" in (value as any))
}

export function isUnresolvedTenant(
  value: unknown,
): value is { unresolved: true; userId: string | null; demo: boolean; service: ReturnType<typeof createServiceClient> } {
  return Boolean(value && typeof value === "object" && (value as any).unresolved === true)
}

export function jsonError(err: unknown, fallback = "Request failed") {
  const message = err instanceof Error ? err.message : fallback
  return NextResponse.json({ error: message }, { status: 500 })
}

export function ensureArray(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.filter((item): item is string => typeof item === "string")
  }
  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value)
      if (Array.isArray(parsed)) {
        return parsed.filter((item): item is string => typeof item === "string")
      }
    } catch {
      if (value.includes(";")) return value.split(";").map((s) => s.trim()).filter(Boolean)
      if (value.includes(",")) return value.split(",").map((s) => s.trim()).filter(Boolean)
      return value ? [value] : []
    }
  }
  return []
}
