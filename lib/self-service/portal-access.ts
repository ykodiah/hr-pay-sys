import { randomBytes, createHash } from "crypto"
import type { createServiceClient } from "@/lib/supabase/server"

/**
 * Tenant-side provisioning of employee portal logins.
 *
 * HR never handles a password hash and never sees another tenant's data:
 * every call is scoped by companyId, and the auth user is created through the
 * GoTrue admin API with the service role key that stays on the server.
 */

type Db = ReturnType<typeof createServiceClient>

export type ProvisionMethod = "email" | "temp_password"

const GOTRUE_URL = () => `${process.env.NEXT_PUBLIC_SUPABASE_URL}/auth/v1`
const SERVICE_KEY = () => process.env.SUPABASE_SERVICE_ROLE_KEY as string

function adminHeaders() {
  return {
    apikey: SERVICE_KEY(),
    Authorization: `Bearer ${SERVICE_KEY()}`,
    "Content-Type": "application/json",
  }
}

/** Look up an auth user by exact email without paging the whole user table. */
export async function findAuthUserByEmail(email: string): Promise<{ id: string; email: string } | null> {
  const target = email.trim().toLowerCase()
  if (!target) return null
  const res = await fetch(
    `${GOTRUE_URL()}/admin/users?filter=${encodeURIComponent(target)}&per_page=20`,
    { headers: adminHeaders(), cache: "no-store" },
  )
  if (!res.ok) return null
  const body = await res.json().catch(() => null)
  const users: any[] = Array.isArray(body?.users) ? body.users : []
  const match = users.find((u) => String(u.email || "").toLowerCase() === target)
  return match ? { id: match.id, email: match.email } : null
}

async function createAuthUser(input: {
  email: string
  password: string
  companyId: string
  employeeId: string
  fullName: string
}) {
  const res = await fetch(`${GOTRUE_URL()}/admin/users`, {
    method: "POST",
    headers: adminHeaders(),
    body: JSON.stringify({
      email: input.email,
      password: input.password,
      email_confirm: true,
      user_metadata: {
        full_name: input.fullName,
        role: "employee",
        portal: "employee",
        company_id: input.companyId,
        employee_id: input.employeeId,
        must_change_password: true,
      },
    }),
  })
  const body = await res.json().catch(() => null)
  if (!res.ok) {
    throw new Error(body?.msg || body?.message || "Could not create the portal login")
  }
  return body as { id: string; email: string }
}

async function updateAuthUser(userId: string, payload: Record<string, any>) {
  const res = await fetch(`${GOTRUE_URL()}/admin/users/${userId}`, {
    method: "PUT",
    headers: adminHeaders(),
    body: JSON.stringify(payload),
  })
  const body = await res.json().catch(() => null)
  if (!res.ok) throw new Error(body?.msg || body?.message || "Could not update the portal login")
  return body
}

/** Ask GoTrue for a one-time link (recovery = set your own password). */
export async function generatePortalLink(
  email: string,
  redirectTo: string,
  type: "recovery" | "invite" = "recovery",
): Promise<string | null> {
  const res = await fetch(`${GOTRUE_URL()}/admin/generate_link`, {
    method: "POST",
    headers: adminHeaders(),
    body: JSON.stringify({ type, email, redirect_to: redirectTo }),
  })
  if (!res.ok) return null
  const body = await res.json().catch(() => null)
  return body?.action_link || body?.properties?.action_link || null
}

/**
 * Human-friendly but high-entropy temporary password.
 * Supabase's default password policy requires at least one lowercase, one
 * uppercase, one digit, and one special character — so we guarantee all four
 * classes are present rather than relying on chance from a single alphabet.
 */
export function generateTempPassword(): string {
  const lower = "abcdefghijkmnopqrstuvwxyz"
  const upper = "ABCDEFGHJKLMNPQRSTUVWXYZ"
  const digits = "23456789"
  const special = "!@#$%^&*"
  const alphabet = lower + upper + digits + special
  const bytes = randomBytes(16)

  const pick = (set: string, byte: number) => set[byte % set.length]

  // Guarantee one of each required character class first.
  const required = [pick(lower, bytes[0]), pick(upper, bytes[1]), pick(digits, bytes[2]), pick(special, bytes[3])]

  let rest = ""
  for (let i = 4; i < 12; i += 1) rest += pick(alphabet, bytes[i])

  // Shuffle so the required characters aren't always in the same positions.
  const chars = [...required, ...rest.split("")]
  for (let i = chars.length - 1; i > 0; i -= 1) {
    const j = bytes[(i + 4) % bytes.length] % (i + 1)
    ;[chars[i], chars[j]] = [chars[j], chars[i]]
  }

  const out = chars.join("")
  return `${out.slice(0, 4)}-${out.slice(4, 8)}-${out.slice(8, 12)}`
}

export function hashToken(token: string) {
  return createHash("sha256").update(token).digest("hex")
}

export function pickLoginEmail(employee: Record<string, any>): string {
  const candidate = employee.corporate_email || employee.personal_email || employee.email || ""
  return String(candidate).trim().toLowerCase()
}

export function employeeDisplayName(employee: Record<string, any>): string {
  return (
    employee.display_name ||
    employee.full_name ||
    `${employee.first_name || ""} ${employee.last_name || ""}`.trim() ||
    employee.employee_id ||
    "Employee"
  )
}

/**
 * Enable (or re-issue) portal access for one employee of one company.
 * Returns the temp password only when the temp_password method is used.
 */
export async function provisionPortalAccess(input: {
  db: Db
  companyId: string
  employee: Record<string, any>
  method: ProvisionMethod
  loginEmail?: string | null
  invitedBy?: string | null
  origin: string
}): Promise<{
  account: Record<string, any>
  tempPassword?: string
  inviteLink?: string | null
  loginEmail: string
}> {
  const { db, companyId, employee, method, invitedBy, origin } = input

  if (employee.company_id !== companyId) {
    throw new Error("Employee does not belong to this organisation")
  }

  const loginEmail = String(input.loginEmail || pickLoginEmail(employee))
    .trim()
    .toLowerCase()
  if (!loginEmail || !loginEmail.includes("@")) {
    throw new Error("This employee has no valid email address. Add one before enabling portal access.")
  }

  // Email must be unique inside the tenant, and cannot belong to someone else's portal account.
  const { data: emailClash } = await db
    .from("employee_portal_accounts")
    .select("id, employee_id")
    .eq("company_id", companyId)
    .ilike("login_email", loginEmail)
    .maybeSingle()
  if (emailClash && emailClash.employee_id !== employee.id) {
    throw new Error(`${loginEmail} is already used by another employee's portal login.`)
  }

  const fullName = employeeDisplayName(employee)
  const tempPassword = generateTempPassword()

  let authUser = await findAuthUserByEmail(loginEmail)
  let issuedTempPassword: string | undefined

  if (!authUser) {
    authUser = await createAuthUser({
      email: loginEmail,
      password: tempPassword,
      companyId,
      employeeId: employee.id,
      fullName,
    })
    if (method === "temp_password") issuedTempPassword = tempPassword
  } else if (method === "temp_password") {
    await updateAuthUser(authUser.id, {
      password: tempPassword,
      email_confirm: true,
      user_metadata: {
        full_name: fullName,
        company_id: companyId,
        employee_id: employee.id,
        must_change_password: true,
      },
    })
    issuedTempPassword = tempPassword
  }

  // The auth user is only useful once it resolves to this employee record —
  // every self-service page and the login redirect look this up by auth user id.
  if (authUser?.id) {
    const { error: profileError } = await db.from("employee_profiles").upsert({
      id: authUser.id,
      employee_id: employee.id,
      updated_at: new Date().toISOString(),
    })
    if (profileError) throw new Error(profileError.message)
  }

  let inviteLink: string | null = null
  if (method === "email") {
    inviteLink = await generatePortalLink(
      loginEmail,
      `${origin}/auth/reset-password`,
      "recovery",
    )
  }

  const now = new Date().toISOString()
  const payload: Record<string, any> = {
    company_id: companyId,
    employee_id: employee.id,
    user_id: authUser?.id ?? null,
    login_email: loginEmail,
    status: "invited",
    must_change_password: true,
    invite_method: method,
    invite_sent_at: now,
    invite_expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    invited_by: invitedBy || null,
    updated_at: now,
  }

  const { data: existing } = await db
    .from("employee_portal_accounts")
    .select("id, status, activated_at")
    .eq("employee_id", employee.id)
    .maybeSingle()

  if (existing?.activated_at) {
    payload.status = "active"
    payload.activated_at = existing.activated_at
  }

  const { data: account, error } = existing
    ? await db
        .from("employee_portal_accounts")
        .update(payload)
        .eq("id", existing.id)
        .select("*")
        .single()
    : await db.from("employee_portal_accounts").insert(payload).select("*").single()

  if (error) throw new Error(error.message)

  // Drop an in-portal welcome notification so the inbox is never empty on day one.
  try {
    await db.from("employee_notifications").insert({
      company_id: companyId,
      employee_id: employee.id,
      category: "account",
      title: "Welcome to your employee portal",
      message: "Your portal access is ready. Set a new password on first sign-in.",
      body: `Hello ${fullName}, your employee portal account has been created. You can view payslips, request leave, track loans and update your details here.`,
      severity: "info",
      action_url: "/self-service",
      created_by: invitedBy || null,
    })
  } catch {
    // non-fatal
  }

  return { account, tempPassword: issuedTempPassword, inviteLink, loginEmail }
}

export async function setPortalAccountStatus(input: {
  db: Db
  companyId: string
  employeeId: string
  status: "active" | "suspended" | "disabled"
  reason?: string | null
}) {
  const { db, companyId, employeeId, status, reason } = input
  const patch: Record<string, any> = { status, updated_at: new Date().toISOString() }
  if (status === "suspended" || status === "disabled") {
    patch.suspended_at = new Date().toISOString()
    patch.suspended_reason = reason || null
  } else {
    patch.suspended_at = null
    patch.suspended_reason = null
  }

  const { data, error } = await db
    .from("employee_portal_accounts")
    .update(patch)
    .eq("company_id", companyId)
    .eq("employee_id", employeeId)
    .select("*")
    .maybeSingle()

  if (error) throw new Error(error.message)
  if (!data) throw new Error("Portal account not found for this employee")
  return data
}
