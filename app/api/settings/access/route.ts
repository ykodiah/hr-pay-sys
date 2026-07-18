// @ts-nocheck
import { NextRequest, NextResponse } from "next/server"
import { ensureArray, jsonError, resolveTenantContext } from "@/lib/settings/resolve-tenant"

export async function GET(req: NextRequest) {
  try {
    const ctx = await resolveTenantContext(req)
    if (ctx instanceof NextResponse) return ctx
    const { companyId, service } = ctx

    const [{ data: accessData, error: accessError }, { data: sessionsData, error: sessionsError }] = await Promise.all([
      service.from("access_control_settings").select("*").eq("company_id", companyId).maybeSingle(),
      service
        .from("active_sessions")
        .select("id, user_email, ip_address, device, last_activity, is_active, company_id")
        .eq("company_id", companyId)
        .order("last_activity", { ascending: false })
        .limit(50),
    ])

    if (accessError) throw accessError
    if (sessionsError) throw sessionsError

    const accessSettings = accessData
      ? {
          twoFactorEnabled: !!accessData.two_factor_enabled,
          ssoEnabled: !!accessData.sso_enabled,
          passwordExpiryEnabled: !!accessData.password_expiry_enabled,
          sessionTimeout: accessData.session_timeout ?? 30,
          maxLoginAttempts: accessData.max_login_attempts ?? 5,
          passwordMinLength: accessData.password_min_length ?? 8,
          ipRestrictionsEnabled: !!accessData.ip_restrictions_enabled,
          allowedIPs: ensureArray(accessData.allowed_ips),
        }
      : null

    const activeSessions = (sessionsData || [])
      .filter((session) => session.is_active !== false)
      .map((session) => ({
        id: session.id,
        user_email: session.user_email || "Unknown",
        ip_address: session.ip_address || "—",
        device: session.device || "Unspecified",
        last_activity: session.last_activity || new Date().toISOString(),
      }))

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
      const { error } = await service.from("access_control_settings").upsert(
        {
          company_id: companyId,
          two_factor_enabled: !!s.twoFactorEnabled,
          sso_enabled: !!s.ssoEnabled,
          password_expiry_enabled: !!s.passwordExpiryEnabled,
          session_timeout: Number(s.sessionTimeout || 30),
          max_login_attempts: Number(s.maxLoginAttempts || 5),
          password_min_length: Number(s.passwordMinLength || 8),
          ip_restrictions_enabled: !!s.ipRestrictionsEnabled,
          allowed_ips: ensureArray(s.allowedIPs),
          updated_at: now,
        },
        { onConflict: "company_id" },
      )
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

    return NextResponse.json({ error: `Unknown action: ${action}` }, { status: 400 })
  } catch (err) {
    return jsonError(err, "Failed to save access settings")
  }
}
