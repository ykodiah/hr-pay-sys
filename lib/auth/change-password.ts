import { createClient as createSupabaseClient } from "@supabase/supabase-js"
import { createClient, createServiceClient } from "@/lib/supabase/server"

export type PasswordChangeInput = {
  email: string
  userId: string
  currentPassword: string
  newPassword: string
  confirmPassword: string
  userMetadata?: Record<string, unknown> | null
  companyId?: string | null
  employeeId?: string | null
  /** When true, clear employee_portal_accounts.must_change_password */
  clearPortalFlag?: boolean
}

export type PasswordPolicy = {
  password_min_length?: number | null
  password_require_uppercase?: boolean | null
  password_require_lowercase?: boolean | null
  password_require_numbers?: boolean | null
  password_require_special?: boolean | null
} | null

export function validatePasswordChange(
  input: Omit<PasswordChangeInput, "email" | "userId" | "userMetadata" | "companyId" | "employeeId" | "clearPortalFlag">,
  policy?: PasswordPolicy,
): string | null {
  const current = String(input.currentPassword || "")
  const next = String(input.newPassword || "")
  const confirm = String(input.confirmPassword || "")
  if (!current || !next || !confirm) return "Complete all password fields"
  if (next !== confirm) return "New passwords do not match"
  const minLength = Math.max(8, Number(policy?.password_min_length || 8))
  if (next.length < minLength) return `New password must be at least ${minLength} characters`
  if (policy?.password_require_lowercase !== false && !/[a-z]/.test(next)) return "Use at least one lowercase letter"
  if (policy?.password_require_uppercase !== false && !/[A-Z]/.test(next)) return "Use at least one uppercase letter"
  if (policy?.password_require_numbers !== false && !/[0-9]/.test(next)) return "Use at least one number"
  if (policy?.password_require_special === true && !/[^A-Za-z0-9]/.test(next)) return "Use at least one special character"
  if (current === next) return "Choose a different password"
  return null
}

/**
 * Verify current password, then update via Auth Admin (service role) with a
 * cookie-session updateUser fallback. Clears portal must-change flags when asked.
 */
export async function changeAuthenticatedPassword(input: PasswordChangeInput, policy?: PasswordPolicy) {
  const validationError = validatePasswordChange(input, policy)
  if (validationError) return { ok: false as const, status: 400, error: validationError }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url || !anon) {
    return { ok: false as const, status: 503, error: "Password change requires a live authentication service" }
  }

  const verifier = createSupabaseClient(url, anon, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
  const { error: verifyError } = await verifier.auth.signInWithPassword({
    email: input.email,
    password: input.currentPassword,
  })
  if (verifyError) {
    return { ok: false as const, status: 400, error: "Current password is incorrect" }
  }

  const metadata = {
    ...(input.userMetadata || {}),
    must_change_password: false,
  }

  let updated = false
  let lastError = ""

  // Preferred: service-role Admin API (reliable even when cookie refresh is flaky).
  try {
    const service = createServiceClient()
    if (!(service as any).__isMock) {
      const { error } = await service.auth.admin.updateUserById(input.userId, {
        password: input.newPassword,
        user_metadata: metadata,
      })
      if (!error) updated = true
      else lastError = error.message
    }
  } catch (error: any) {
    lastError = error?.message || "Admin password update failed"
  }

  // Fallback: authenticated cookie session updateUser.
  if (!updated) {
    const authenticated = await createClient()
    if ((authenticated as any).__isMock) {
      return {
        ok: false as const,
        status: 400,
        error: "Password cannot be changed in demo mode. Sign in with a real account.",
      }
    }
    const { data: sessionData, error: sessionError } = await authenticated.auth.getUser()
    if (sessionError || sessionData.user?.id !== input.userId) {
      return { ok: false as const, status: 401, error: "Your session expired. Sign in again and retry." }
    }
    const { error } = await authenticated.auth.updateUser({
      password: input.newPassword,
      data: metadata,
    })
    if (error) {
      return {
        ok: false as const,
        status: 400,
        error: lastError || error.message || "The password could not be updated",
      }
    }
    updated = true
  }

  if (input.clearPortalFlag && input.companyId) {
    try {
      const service = createServiceClient()
      let query = service
        .from("employee_portal_accounts")
        .update({
          must_change_password: false,
          status: "active",
          updated_at: new Date().toISOString(),
          activated_at: new Date().toISOString(),
        })
        .eq("company_id", input.companyId)
      if (input.employeeId) query = query.eq("employee_id", input.employeeId)
      else query = query.eq("user_id", input.userId)
      await query
    } catch {
      // Non-fatal: Auth password already changed.
    }
  }

  return { ok: true as const }
}
