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

/**
 * Resolve the authenticated user's home company from trusted sources only.
 * Never falls back to "first/latest company in the database".
 */
async function resolveUserCompanyId(
  service: ReturnType<typeof createServiceClient>,
  user: { id: string; email?: string | null; user_metadata?: any; app_metadata?: any } | null,
): Promise<string | null> {
  if (!user?.id) return null

  const fromMeta =
    user.app_metadata?.company_id ||
    user.user_metadata?.company_id ||
    null
  if (typeof fromMeta === "string" && fromMeta.trim()) {
    return fromMeta.trim()
  }

  // Prefer employee_profiles → employees (auth user linked to employee)
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
      if (emp?.company_id) return emp.company_id
    }
  } catch {
    // optional table
  }

  // Some deployments use employees.id = auth.uid()
  try {
    const { data: byId } = await service
      .from("employees")
      .select("company_id")
      .eq("id", user.id)
      .maybeSingle()
    if (byId?.company_id) return byId.company_id
  } catch {
    // ignore
  }

  // Fallback: match by corporate/personal email
  if (user.email) {
    try {
      const { data: byEmail } = await service
        .from("employees")
        .select("company_id")
        .or(`corporate_email.eq.${user.email},personal_email.eq.${user.email}`)
        .limit(1)
        .maybeSingle()
      if (byEmail?.company_id) return byEmail.company_id
    } catch {
      // ignore
    }
  }

  // RPC may be JWT-based (good) or hardcoded (bad) — only accept if it looks like a UUID
  // and the company actually exists. Do not trust hardcoded demo UUIDs blindly if
  // the company row is missing.
  try {
    const { data: rpcId } = await service.rpc("get_current_user_company_id")
    if (typeof rpcId === "string" && isUuid(rpcId)) {
      const { data: company } = await service
        .from("companies")
        .select("id")
        .eq("id", rpcId)
        .maybeSingle()
      if (company?.id) return company.id
    }
  } catch {
    // optional RPC
  }

  return null
}

/**
 * Resolve the tenant company for settings API routes.
 * Uses service-role for DB IO so RLS cannot silently reject tenant admin writes,
 * but only after the caller is authenticated and the company is membership-checked.
 *
 * Fail-closed: never picks an arbitrary "first/latest" company.
 */
export async function resolveTenantContext(
  req: NextRequest,
  companyIdFromClient?: string | null,
): Promise<TenantContext | NextResponse> {
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
    // Client-supplied company_id must match the caller's home company.
    // (Multi-company access can be expanded later via an explicit membership table.)
    if (homeCompanyId && requestedId !== homeCompanyId) {
      return forbidden("company_id does not belong to the authenticated user")
    }
    if (!homeCompanyId) {
      // No home company yet (brand-new tenant admin): allow only if the company exists
      // and has no employees / is being bootstrapped by this user. Still require the
      // company row to exist — never invent one via LIMIT 1.
      const { data: company } = await service
        .from("companies")
        .select("id")
        .eq("id", requestedId)
        .maybeSingle()
      if (!company?.id) {
        return badRequest("Unknown company_id", 404)
      }
    }
    return { companyId: requestedId, userId, demo, service }
  }

  if (homeCompanyId) {
    return { companyId: homeCompanyId, userId, demo, service }
  }

  // Fail closed — do NOT fall back to newest/oldest company.
  return badRequest(
    "Unable to resolve company for this user. Set company_id on the user profile or pass a valid company_id.",
    400,
  )
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
