// @ts-nocheck
import { NextRequest, NextResponse } from "next/server"
import { ensureArray, jsonError, resolveTenantContext } from "@/lib/settings/resolve-tenant"

function isMissingRelation(error: any) {
  const message = String(error?.message || error || "").toLowerCase()
  return (
    error?.code === "42P01" ||
    error?.code === "PGRST205" ||
    message.includes("does not exist") ||
    message.includes("could not find the table")
  )
}

function isColumnError(error: any) {
  const message = String(error?.message || error || "").toLowerCase()
  return (
    error?.code === "PGRST204" ||
    message.includes("column") ||
    message.includes("schema cache") ||
    message.includes("could not find")
  )
}

const DEFAULT_ACCESS = {
  twoFactorEnabled: false,
  ssoEnabled: false,
  passwordExpiryEnabled: true,
  passwordExpiryDays: 90,
  sessionTimeout: 30,
  maxLoginAttempts: 5,
  lockoutDuration: 15,
  passwordMinLength: 8,
  passwordRequireUppercase: true,
  passwordRequireLowercase: true,
  passwordRequireNumbers: true,
  passwordRequireSpecial: false,
  ipRestrictionsEnabled: false,
  allowedIPs: [] as string[],
}

export async function GET(req: NextRequest) {
  try {
    const ctx = await resolveTenantContext(req)
    if (ctx instanceof NextResponse) return ctx
    const { companyId, service } = ctx

    const [accessRes, sessionsRes] = await Promise.all([
      service.from("access_control_settings").select("*").eq("company_id", companyId).maybeSingle(),
      service
        .from("active_sessions")
        .select("id, user_email, ip_address, device, browser, os, last_activity, is_active, company_id")
        .eq("company_id", companyId)
        .order("last_activity", { ascending: false })
        .limit(50),
    ])

    const { data: accessData, error: accessError } = accessRes
    if (accessError && !isMissingRelation(accessError) && !isColumnError(accessError)) throw accessError

    const accessSettings = accessData
      ? {
          twoFactorEnabled: !!accessData.two_factor_enabled,
          ssoEnabled: !!accessData.sso_enabled,
          passwordExpiryEnabled: accessData.password_expiry_enabled !== false,
          passwordExpiryDays: accessData.password_expiry_days ?? 90,
          sessionTimeout: accessData.session_timeout ?? 30,
          maxLoginAttempts: accessData.max_login_attempts ?? 5,
          lockoutDuration: accessData.lockout_duration ?? 15,
          passwordMinLength: accessData.password_min_length ?? 8,
          passwordRequireUppercase: accessData.password_require_uppercase !== false,
          passwordRequireLowercase: accessData.password_require_lowercase !== false,
          passwordRequireNumbers: accessData.password_require_numbers !== false,
          passwordRequireSpecial: !!accessData.password_require_special,
          ipRestrictionsEnabled: !!accessData.ip_restrictions_enabled,
          allowedIPs: ensureArray(accessData.allowed_ips),
        }
      : { ...DEFAULT_ACCESS }

    let activeSessions: any[] = []
    if (!sessionsRes.error) {
      activeSessions = (sessionsRes.data || [])
        .filter((session) => session.is_active !== false)
        .map((session) => ({
          id: session.id,
          user_email: session.user_email || "Unknown",
          ip_address: session.ip_address || "—",
          device: session.device || "Unspecified",
          browser: session.browser || "",
          os: session.os || "",
          last_activity: session.last_activity || new Date().toISOString(),
        }))
    } else if (!isMissingRelation(sessionsRes.error) && !isColumnError(sessionsRes.error)) {
      throw sessionsRes.error
    }

    return NextResponse.json({ accessSettings, activeSessions })
  } catch (err) {
    return jsonError(err, "Failed to load access settings")
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const ctx = await resolveTenantContext(req, body.company_id)
    if (ctx instanceof NextResponse) return ctx
    const { companyId, service } = ctx
    const now = new Date().toISOString()
    const action = body.action || "save"

    if (action === "save") {
      const s = body.settings || body
      const fullRow = {
        company_id: companyId,
        two_factor_enabled: !!s.twoFactorEnabled,
        sso_enabled: !!s.ssoEnabled,
        password_expiry_enabled: s.passwordExpiryEnabled !== false,
        password_expiry_days: Number(s.passwordExpiryDays || 90),
        session_timeout: Number(s.sessionTimeout || 30),
        max_login_attempts: Number(s.maxLoginAttempts || 5),
        lockout_duration: Number(s.lockoutDuration || 15),
        password_min_length: Number(s.passwordMinLength || 8),
        password_require_uppercase: s.passwordRequireUppercase !== false,
        password_require_lowercase: s.passwordRequireLowercase !== false,
        password_require_numbers: s.passwordRequireNumbers !== false,
        password_require_special: !!s.passwordRequireSpecial,
        ip_restrictions_enabled: !!s.ipRestrictionsEnabled,
        allowed_ips: ensureArray(s.allowedIPs).filter((ip: string) => String(ip).trim()),
        updated_at: now,
      }

      // Fallback to the core columns if an older schema lacks the newer policy fields.
      const coreRow = {
        company_id: companyId,
        two_factor_enabled: fullRow.two_factor_enabled,
        sso_enabled: fullRow.sso_enabled,
        password_expiry_enabled: fullRow.password_expiry_enabled,
        session_timeout: fullRow.session_timeout,
        max_login_attempts: fullRow.max_login_attempts,
        password_min_length: fullRow.password_min_length,
        ip_restrictions_enabled: fullRow.ip_restrictions_enabled,
        allowed_ips: fullRow.allowed_ips,
        updated_at: now,
      }

      let { error } = await service
        .from("access_control_settings")
        .upsert(fullRow, { onConflict: "company_id" })
      if (error && isColumnError(error)) {
        const retry = await service
          .from("access_control_settings")
          .upsert(coreRow, { onConflict: "company_id" })
        error = retry.error
      }
      if (error) throw error
      return NextResponse.json({ success: true })
    }

    if (action === "terminate_session") {
      const { error } = await service
        .from("active_sessions")
        .update({ is_active: false, expires_at: now })
        .eq("id", body.session_id)
        .eq("company_id", companyId)
      if (error) throw error
      return NextResponse.json({ success: true })
    }

    if (action === "terminate_all_sessions") {
      const { error } = await service
        .from("active_sessions")
        .update({ is_active: false, expires_at: now })
        .eq("company_id", companyId)
        .eq("is_active", true)
      if (error) throw error
      return NextResponse.json({ success: true })
    }

    return NextResponse.json({ error: `Unknown action: ${action}` }, { status: 400 })
  } catch (err) {
    return jsonError(err, "Failed to save access settings")
  }
}
