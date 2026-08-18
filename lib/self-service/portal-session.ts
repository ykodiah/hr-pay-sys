import { NextResponse } from "next/server"
import { headers } from "next/headers"
import { createServiceClient } from "@/lib/supabase/server"
import { requireApiUser, type ApiUser } from "@/lib/auth/api-user"

/**
 * Employee portal session resolution.
 *
 * Isolation contract
 * ------------------
 * The ONLY authoritative link between an auth user and an employee row is
 * `employee_portal_accounts.user_id`. Email matching is used exclusively to
 * self-heal legacy tenants, and only when it resolves to exactly one employee
 * across the whole database — an ambiguous email can never grant access.
 *
 * Every downstream query MUST filter by both `employee_id` and `company_id`
 * from this session; never trust an id supplied by the client.
 */

export type PortalAccount = {
  id: string
  company_id: string
  employee_id: string
  user_id: string | null
  login_email: string
  status: "invited" | "active" | "suspended" | "disabled"
  access_level: "employee" | "manager"
  must_change_password: boolean
  last_login_at: string | null
}

export type PortalSession = {
  user: ApiUser
  companyId: string
  companyName: string | null
  employeeId: string
  employee: Record<string, any>
  account: PortalAccount | null
  canAccessAdmin: boolean
  db: ReturnType<typeof createServiceClient>
}

const ADMIN_META_ROLES = new Set([
  "owner",
  "admin",
  "administrator",
  "hr",
  "hr_manager",
  "payroll_manager",
  "superadmin",
])

function metaRole(user: ApiUser): string {
  const raw =
    (user.user_metadata?.role as string) ||
    (user.app_metadata?.role as string) ||
    (user.user_metadata?.portal_role as string) ||
    (user.app_metadata?.portal_role as string) ||
    ""
  return String(raw).trim().toLowerCase()
}

/** Does this auth user also have tenant-admin rights (drives the portal switcher)? */
export async function resolveAdminAccess(
  db: ReturnType<typeof createServiceClient>,
  user: ApiUser,
  companyId: string | null,
): Promise<boolean> {
  if (ADMIN_META_ROLES.has(metaRole(user))) return true

  if (companyId) {
    try {
      const { data: tenantProfile } = await db
        .from("tenant_user_profiles")
        .select("user_id")
        .eq("user_id", user.id)
        .eq("company_id", companyId)
        .maybeSingle()
      if (tenantProfile?.user_id) return true
    } catch {
      // optional on databases that have not applied the portal expansion yet
    }
  }

  const email = (user.email || "").trim().toLowerCase()
  if (email && companyId) {
    try {
      const { data } = await db
        .from("companies")
        .select("id, email_address, email")
        .eq("id", companyId)
        .maybeSingle()
      const contact = [data?.email_address, data?.email]
        .filter(Boolean)
        .map((v: string) => v.trim().toLowerCase())
      if (contact.includes(email)) return true
    } catch {
      // optional
    }
  }

  return false
}

async function loadEmployee(
  db: ReturnType<typeof createServiceClient>,
  employeeId: string,
  companyId?: string | null,
) {
  let q = db.from("employees").select("*").eq("id", employeeId)
  if (companyId) q = q.eq("company_id", companyId)
  const { data } = await q.maybeSingle()
  return data
}

/**
 * Self-heal path for tenants created before portal accounts existed.
 * Requires an unambiguous single match, otherwise returns null.
 */
async function backfillAccountFromLegacyLink(
  db: ReturnType<typeof createServiceClient>,
  user: ApiUser,
): Promise<PortalAccount | null> {
  let employee: any = null

  // 1) employee_profiles link (auth.uid -> employee)
  try {
    const { data: profile } = await db
      .from("employee_profiles")
      .select("employee_id")
      .eq("id", user.id)
      .maybeSingle()
    if (profile?.employee_id) {
      employee = await loadEmployee(db, profile.employee_id)
    }
  } catch {
    // optional table
  }

  // 2) employees.id === auth.uid()
  if (!employee) {
    employee = await loadEmployee(db, user.id)
  }

  // 3) Unambiguous email match
  const email = (user.email || "").trim()
  if (!employee && email) {
    const { data: matches } = await db
      .from("employees")
      .select("*")
      .or(`corporate_email.eq.${email},personal_email.eq.${email}`)
      .not("company_id", "is", null)
      .limit(5)

    const unique = new Map<string, any>()
    for (const row of matches || []) unique.set(row.id, row)
    if (unique.size === 1) employee = [...unique.values()][0]
  }

  if (!employee?.id || !employee?.company_id) return null

  const { data: existing } = await db
    .from("employee_portal_accounts")
    .select("*")
    .eq("employee_id", employee.id)
    .maybeSingle()

  // Never hijack an account already bound to a different auth user.
  if (existing && existing.user_id && existing.user_id !== user.id) return null

  const payload = {
    company_id: employee.company_id,
    employee_id: employee.id,
    user_id: user.id,
    login_email: (user.email || employee.corporate_email || employee.personal_email || "").trim(),
    status: "active" as const,
    must_change_password: false,
    activated_at: new Date().toISOString(),
  }

  const { data: saved } = existing
    ? await db
        .from("employee_portal_accounts")
        .update(payload)
        .eq("id", existing.id)
        .select("*")
        .maybeSingle()
    : await db.from("employee_portal_accounts").insert(payload).select("*").maybeSingle()

  return (saved as PortalAccount) || null
}

export async function resolvePortalSession(): Promise<
  { session: PortalSession } | { error: string; status: number }
> {
  const user = await requireApiUser()
  if (!user || user.isDemo) {
    return { error: "Sign in to access your employee portal.", status: 401 }
  }

  const db = createServiceClient()

  let account: PortalAccount | null = null
  const { data: linked } = await db
    .from("employee_portal_accounts")
    .select("*")
    .eq("user_id", user.id)
    .in("status", ["active", "invited"])
    .limit(1)
    .maybeSingle()
  account = (linked as PortalAccount) || null

  if (!account) {
    account = await backfillAccountFromLegacyLink(db, user)
  }

  if (!account) {
    return {
      error:
        "No employee portal account is linked to this login. Ask your HR administrator to enable portal access for you.",
      status: 403,
    }
  }

  if (account.status === "suspended" || account.status === "disabled") {
    return { error: "Your portal access has been suspended. Contact HR.", status: 403 }
  }

  const employee = await loadEmployee(db, account.employee_id, account.company_id)
  if (!employee) {
    return { error: "Your employee record could not be found in this organisation.", status: 404 }
  }

  let companyName: string | null = null
  try {
    const { data } = await db
      .from("companies")
      .select("name")
      .eq("id", account.company_id)
      .maybeSingle()
    companyName = data?.name ?? null
  } catch {
    companyName = null
  }

  const canAccessAdmin = await resolveAdminAccess(db, user, account.company_id)

  // Throttled login stamp — at most one write per 30 minutes per account.
  const lastSeen = account.last_login_at ? new Date(account.last_login_at).getTime() : 0
  if (Date.now() - lastSeen > 30 * 60 * 1000) {
    const stamped = new Date().toISOString()
    void db
      .from("employee_portal_accounts")
      .update({ last_login_at: stamped, login_count: (account as any).login_count + 1 || 1 })
      .eq("id", account.id)
      .then(() => undefined, () => undefined)
    account.last_login_at = stamped
  }

  return {
    session: {
      user,
      companyId: account.company_id,
      companyName,
      employeeId: account.employee_id,
      employee,
      account,
      canAccessAdmin,
      db,
    },
  }
}

/** Route-handler guard. Returns a NextResponse on failure. */
export async function requirePortalSession(): Promise<PortalSession | NextResponse> {
  const result = await resolvePortalSession()
  if ("error" in result) {
    return NextResponse.json({ error: result.error }, { status: result.status })
  }
  return result.session
}

export function isPortalError(value: unknown): value is NextResponse {
  return value instanceof NextResponse
}

/** Append a row to the portal activity trail. Never throws. */
export async function logPortalActivity(
  session: PortalSession,
  action: string,
  detail?: string,
  metadata: Record<string, any> = {},
) {
  try {
    const h = await headers()
    await session.db.from("employee_portal_activity").insert({
      company_id: session.companyId,
      employee_id: session.employeeId,
      user_id: session.user.id,
      action,
      detail: detail || null,
      ip_address: h.get("x-forwarded-for") || h.get("x-real-ip") || null,
      user_agent: h.get("user-agent") || null,
      metadata,
    })
  } catch {
    // activity logging must never break a request
  }
}

export function portalJsonError(err: unknown, fallback = "Request failed") {
  const message = err instanceof Error ? err.message : fallback
  return NextResponse.json({ error: message }, { status: 500 })
}
