import { NextRequest, NextResponse } from "next/server"
import { createClient as createSupabaseClient } from "@supabase/supabase-js"
import {
  requirePortalSession,
  isPortalError,
  portalJsonError,
  logPortalActivity,
} from "@/lib/self-service/portal-session"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

/** GET — account + notification preferences for the signed-in employee. */
/** `email_digest` is stored as text (legacy EAV column); coerce it back to a boolean for the UI. */
function normalizePreferences(row: Record<string, any> | null) {
  if (!row) {
    return {
      payroll_notifications: true,
      leave_notifications: true,
      attendance_alerts: true,
      promotion_notifications: true,
      system_maintenance_alerts: true,
      email_digest: false,
      sms_alerts: false,
      push_notifications: true,
    }
  }
  return { ...row, email_digest: row.email_digest === true || row.email_digest === "true" }
}

export async function GET() {
  const session = await requirePortalSession()
  if (isPortalError(session)) return session

  try {
    const [prefsRes, activityRes] = await Promise.all([
      session.db
        .from("notification_settings")
        .select("*")
        .eq("employee_id", session.employeeId)
        .eq("company_id", session.companyId)
        .maybeSingle(),
      session.db
        .from("employee_portal_activity")
        .select("action, detail, created_at, ip_address")
        .eq("employee_id", session.employeeId)
        .order("created_at", { ascending: false })
        .limit(15),
    ])

    return NextResponse.json({
      account: {
        login_email: session.account?.login_email,
        status: session.account?.status,
        must_change_password: session.account?.must_change_password,
        last_login_at: session.account?.last_login_at,
        can_access_admin: session.canAccessAdmin,
      },
      preferences: normalizePreferences(prefsRes.data),
      activity: activityRes.data || [],
    })
  } catch (err) {
    return portalJsonError(err, "Failed to load account settings")
  }
}

const PREF_FLAGS = [
  "payroll_notifications",
  "leave_notifications",
  "attendance_alerts",
  "promotion_notifications",
  "system_maintenance_alerts",
  "email_digest",
  "sms_alerts",
  "push_notifications",
] as const

/** PATCH — save notification preferences. */
export async function PATCH(req: NextRequest) {
  const session = await requirePortalSession()
  if (isPortalError(session)) return session

  try {
    const body = await req.json().catch(() => ({}))
    // `notification_settings` also stores per-company EAV preference rows (category/notification_type
    // NOT NULL, employee_id null). This per-employee flat row uses sentinel values that never collide
    // with those admin-side rows.
    const payload: Record<string, any> = {
      company_id: session.companyId,
      employee_id: session.employeeId,
      category: "preference",
      notification_type: "employee_flat",
      updated_at: new Date().toISOString(),
    }
    for (const flag of PREF_FLAGS) {
      if (body[flag] !== undefined) payload[flag] = flag === "email_digest" ? String(Boolean(body[flag])) : Boolean(body[flag])
    }

    const { data: existing } = await session.db
      .from("notification_settings")
      .select("id")
      .eq("employee_id", session.employeeId)
      .eq("company_id", session.companyId)
      .maybeSingle()

    const { data, error } = existing
      ? await session.db
          .from("notification_settings")
          .update(payload)
          .eq("id", existing.id)
          .select("*")
          .single()
      : await session.db.from("notification_settings").insert(payload).select("*").single()

    if (error) throw new Error(error.message)
    return NextResponse.json({ success: true, preferences: normalizePreferences(data) })
  } catch (err) {
    return portalJsonError(err, "Failed to save preferences")
  }
}

/** POST — change password. Verifies the current password before updating. */
export async function POST(req: NextRequest) {
  const session = await requirePortalSession()
  if (isPortalError(session)) return session

  try {
    const body = await req.json().catch(() => ({}))
    const current = String(body.current_password || "")
    const next = String(body.new_password || "")

    if (!current || !next) {
      return NextResponse.json({ error: "Enter your current and new password" }, { status: 400 })
    }
    if (next.length < 10) {
      return NextResponse.json(
        { error: "Your new password must be at least 10 characters" },
        { status: 400 },
      )
    }
    if (!/[a-z]/.test(next) || !/[A-Z]/.test(next) || !/[0-9]/.test(next)) {
      return NextResponse.json(
        { error: "Use at least one uppercase letter, one lowercase letter and one number" },
        { status: 400 },
      )
    }
    if (next === current) {
      return NextResponse.json({ error: "Choose a password you have not used before" }, { status: 400 })
    }

    const email = session.user.email || session.account?.login_email
    if (!email) return NextResponse.json({ error: "No login email on file" }, { status: 400 })

    // Verify in an isolated client so the server-side sign-in does not replace
    // or invalidate the employee's browser session cookies.
    const verifier = createSupabaseClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { auth: { persistSession: false, autoRefreshToken: false } },
    )
    const { error: verifyError } = await verifier.auth.signInWithPassword({
      email,
      password: current,
    })
    if (verifyError) {
      return NextResponse.json({ error: "Your current password is incorrect" }, { status: 400 })
    }

    const { error: updateError } = await session.db.auth.admin.updateUserById(session.user.id, {
      password: next,
      user_metadata: {
        ...(session.user.user_metadata || {}),
        must_change_password: false,
      },
    })
    if (updateError) {
      const message = updateError.message.toLowerCase()
      const safeMessage = message.includes("password") || message.includes("weak")
        ? "The new password does not meet the account password policy"
        : "The password could not be updated. Try again or contact HR."
      return NextResponse.json({ error: safeMessage }, { status: 400 })
    }

    const accountUpdate: Record<string, string | boolean> = {
      must_change_password: false,
      status: "active",
      updated_at: new Date().toISOString(),
    }
    if (session.account?.status === "invited") accountUpdate.activated_at = new Date().toISOString()

    await session.db
      .from("employee_portal_accounts")
      .update(accountUpdate)
      .eq("employee_id", session.employeeId)
      .eq("company_id", session.companyId)

    await logPortalActivity(session, "password_changed")

    return NextResponse.json({ success: true, message: "Password updated" })
  } catch (err) {
    return portalJsonError(err, "Failed to change password")
  }
}
