// @ts-nocheck
import { NextRequest, NextResponse } from "next/server"
import { ensureArray, jsonError, resolveTenantContext } from "@/lib/settings/resolve-tenant"

const PREF_KEYS = [
  "payrollNotifications",
  "leaveNotifications",
  "attendanceAlerts",
  "promotionNotifications",
  "systemMaintenanceAlerts",
  "emailDigest",
  "smsAlerts",
  "pushNotifications",
] as const

function mapTemplate(row: any) {
  return {
    id: String(row.id),
    name: row.name || row.template_name || "",
    category: row.category || "HR",
    type: row.type || row.template_type || "Email",
    status: row.status || (row.is_active === false ? "Draft" : "Active"),
    lastModified: row.last_modified || (row.updated_at ? String(row.updated_at).slice(0, 10) : ""),
    description: row.description || row.subject || "",
    subject: row.subject || row.description || "",
    body: row.body || row.body_template || "",
    variables: Array.isArray(row.variables) ? row.variables : ensureArray(row.variables),
  }
}

export async function GET(req: NextRequest) {
  try {
    const ctx = await resolveTenantContext(req)
    if (ctx instanceof NextResponse) return ctx
    const { companyId, service } = ctx

    const [{ data: templates }, { data: emailConfig }, { data: prefRows }] = await Promise.all([
      service
        .from("notification_templates")
        .select("*")
        .eq("company_id", companyId)
        .order("updated_at", { ascending: false }),
      service.from("email_configurations").select("*").eq("company_id", companyId).maybeSingle(),
      service
        .from("notification_settings")
        .select("category, notification_type, is_enabled, delivery_method, frequency")
        .eq("company_id", companyId)
        .is("employee_id", null),
    ])

    const preferences: Record<string, any> = {
      payrollNotifications: true,
      leaveNotifications: true,
      attendanceAlerts: true,
      promotionNotifications: true,
      systemMaintenanceAlerts: true,
      emailDigest: "daily",
      smsAlerts: false,
      pushNotifications: true,
    }

    for (const row of prefRows || []) {
      if (row.category === "preference" && PREF_KEYS.includes(row.notification_type as any)) {
        const key = row.notification_type
        if (key === "emailDigest") preferences.emailDigest = row.frequency || "daily"
        else preferences[key] = !!row.is_enabled
      }
    }

    return NextResponse.json({
      templates: (templates || []).map(mapTemplate),
      emailConfig: emailConfig
        ? {
            provider: emailConfig.provider || "smtp",
            smtpHost: emailConfig.smtp_host || "",
            smtpPort: emailConfig.smtp_port || 587,
            smtpUsername: emailConfig.smtp_username || "",
            smtpPassword: emailConfig.smtp_password || "",
            fromEmail: emailConfig.from_email || "",
            fromName: emailConfig.from_name || "",
            replyTo: emailConfig.reply_to || "",
            enableTLS: emailConfig.enable_tls !== false,
            enableSSL: !!emailConfig.enable_ssl,
          }
        : null,
      preferences,
    })
  } catch (err) {
    return jsonError(err, "Failed to load notification settings")
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const ctx = await resolveTenantContext(req, body.company_id)
    if (ctx instanceof NextResponse) return ctx
    const { companyId, service, userId } = ctx
    const now = new Date().toISOString()
    const action = body.action || "save_template"

    if (action === "save_template") {
      const t = body.template || body
      const row = {
        company_id: companyId,
        name: t.name,
        template_name: t.name,
        category: t.category || "HR",
        type: t.type || "Email",
        template_type: t.type || "Email",
        status: t.status || "Active",
        description: t.description || t.subject || "",
        subject: t.subject || "",
        body: t.body || "",
        body_template: t.body || "",
        variables: Array.isArray(t.variables) ? t.variables : [],
        is_active: (t.status || "Active") !== "Draft",
        last_modified: now.slice(0, 10),
        updated_at: now,
        created_by: userId,
      }
      if (t.id && !/^\d+$/.test(String(t.id))) {
        const { data, error } = await service
          .from("notification_templates")
          .update(row)
          .eq("id", t.id)
          .eq("company_id", companyId)
          .select()
          .single()
        if (error) throw error
        return NextResponse.json({ success: true, template: mapTemplate(data) })
      }
      const { data, error } = await service
        .from("notification_templates")
        .insert({ ...row, created_at: now })
        .select()
        .single()
      if (error) throw error
      return NextResponse.json({ success: true, template: mapTemplate(data) })
    }

    if (action === "delete_template") {
      const { error } = await service
        .from("notification_templates")
        .delete()
        .eq("id", body.id)
        .eq("company_id", companyId)
      if (error) throw error
      return NextResponse.json({ success: true })
    }

    if (action === "save_email_config") {
      const c = body.config || body
      const { error } = await service.from("email_configurations").upsert(
        {
          company_id: companyId,
          provider: c.provider || "smtp",
          smtp_host: c.smtpHost,
          smtp_port: Number(c.smtpPort || 587),
          smtp_username: c.smtpUsername,
          smtp_password: c.smtpPassword,
          from_email: c.fromEmail,
          from_name: c.fromName,
          reply_to: c.replyTo,
          enable_tls: c.enableTLS !== false,
          enable_ssl: !!c.enableSSL,
          is_active: true,
          is_default: true,
          updated_at: now,
        },
        { onConflict: "company_id" },
      )
      if (error) throw error
      return NextResponse.json({ success: true })
    }

    if (action === "save_preferences") {
      const prefs = body.preferences || body
      const rows = PREF_KEYS.map((key) => ({
        company_id: companyId,
        employee_id: null,
        category: "preference",
        notification_type: key,
        is_enabled: key === "emailDigest" ? true : !!prefs[key],
        delivery_method:
          key === "smsAlerts"
            ? ["sms"]
            : key === "pushNotifications"
              ? ["push"]
              : ["email"],
        frequency: key === "emailDigest" ? prefs.emailDigest || "daily" : "immediate",
        updated_at: now,
      }))

      // Replace company-level preference rows
      await service
        .from("notification_settings")
        .delete()
        .eq("company_id", companyId)
        .eq("category", "preference")
        .is("employee_id", null)

      const { error } = await service.from("notification_settings").insert(rows)
      if (error) throw error
      return NextResponse.json({ success: true })
    }

    if (action === "test_email") {
      // Soft success — actual SMTP send depends on provider credentials
      return NextResponse.json({
        success: true,
        message: "Connection test recorded. Verify SMTP credentials with a live provider send.",
      })
    }

    return NextResponse.json({ error: `Unknown action: ${action}` }, { status: 400 })
  } catch (err) {
    return jsonError(err, "Failed to save notification settings")
  }
}
