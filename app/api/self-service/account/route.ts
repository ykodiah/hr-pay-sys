import { NextRequest, NextResponse } from "next/server"
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
    const email = session.user.email || session.account?.login_email
    if (!email) return NextResponse.json({ error: "No login email on file" }, { status: 400 })

    const { data: policy } = await session.db
      .from("access_control_settings")
      .select("password_min_length, password_require_uppercase, password_require_lowercase, password_require_numbers, password_require_special")
      .eq("company_id", session.companyId)
      .maybeSingle()

    const { changeAuthenticatedPassword } = await import("@/lib/auth/change-password")
    const result = await changeAuthenticatedPassword(
      {
        email,
        userId: session.user.id,
        currentPassword: String(body.current_password || ""),
        newPassword: String(body.new_password || ""),
        confirmPassword: String(body.confirm_password || ""),
        userMetadata: session.user.user_metadata,
        companyId: session.companyId,
        employeeId: session.employeeId,
        clearPortalFlag: true,
      },
      policy,
    )
    if (!result.ok) return NextResponse.json({ error: result.error }, { status: result.status })

    await logPortalActivity(session, "password_changed")
    return NextResponse.json({ success: true, message: "Password updated" })
  } catch (err) {
    return portalJsonError(err, "Failed to change password")
  }
}
