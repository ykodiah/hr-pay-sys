// @ts-nocheck
import { NextRequest, NextResponse } from "next/server"
import { ensureArray, jsonError, resolveTenantContext } from "@/lib/settings/resolve-tenant"

const PREF_KEYS = [
  "welcomeNotifications",
  "payrollNotifications",
  "leaveNotifications",
  "attendanceAlerts",
  "promotionNotifications",
  "systemMaintenanceAlerts",
  "emailDigest",
  "smsAlerts",
  "pushNotifications",
] as const

const DEFAULT_PREFERENCES = {
  welcomeNotifications: true,
  payrollNotifications: true,
  leaveNotifications: true,
  attendanceAlerts: true,
  promotionNotifications: true,
  systemMaintenanceAlerts: true,
  emailDigest: "daily",
  smsAlerts: false,
  pushNotifications: true,
}

function isUuid(value: unknown) {
  return (
    typeof value === "string" &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value)
  )
}

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

function mapTemplate(row: any) {
  return {
    id: String(row.id),
    name: row.name || row.template_name || "",
    category: row.category || "HR",
    type: row.type || row.template_type || "Email",
    status: row.status || (row.is_active === false ? "Draft" : "Active"),
    lastModified: row.last_modified
      ? String(row.last_modified).slice(0, 10)
      : row.updated_at
        ? String(row.updated_at).slice(0, 10)
        : "",
    description: row.description || row.subject || "",
    subject: row.subject || row.description || "",
    body: row.body || row.body_template || "",
    variables: Array.isArray(row.variables) ? row.variables : ensureArray(row.variables),
  }
}

function prefsFromFlatRow(row: any) {
  if (!row) return { ...DEFAULT_PREFERENCES }
  return {
    welcomeNotifications: row.welcome_notifications !== false,
    payrollNotifications: row.payroll_notifications !== false,
    leaveNotifications: row.leave_notifications !== false,
    attendanceAlerts: row.attendance_alerts !== false,
    promotionNotifications: row.promotion_notifications !== false,
    systemMaintenanceAlerts: row.system_maintenance_alerts !== false,
    emailDigest: row.email_digest || "daily",
    smsAlerts: !!row.sms_alerts,
    pushNotifications: row.push_notifications !== false,
  }
}

async function loadPreferences(service: any, companyId: string) {
  const preferences = { ...DEFAULT_PREFERENCES }

  // Prefer EAV rows (059)
  const eav = await service
    .from("notification_settings")
    .select("category, notification_type, is_enabled, delivery_method, frequency")
    .eq("company_id", companyId)
    .eq("category", "preference")
    .is("employee_id", null)

  if (!eav.error && Array.isArray(eav.data) && eav.data.length) {
    for (const row of eav.data) {
      if (!PREF_KEYS.includes(row.notification_type)) continue
      const key = row.notification_type
      if (key === "emailDigest") preferences.emailDigest = row.frequency || "daily"
      else preferences[key] = !!row.is_enabled
    }
    return preferences
  }

  // Fallback: flat 034-style single row
  const flat = await service
    .from("notification_settings")
    .select(
      "payroll_notifications, leave_notifications, attendance_alerts, promotion_notifications, system_maintenance_alerts, email_digest, sms_alerts, push_notifications, welcome_notifications",
    )
    .eq("company_id", companyId)
    .maybeSingle()

  if (!flat.error && flat.data) {
    return prefsFromFlatRow(flat.data)
  }

  if (eav.error && !isMissingRelation(eav.error) && !isColumnError(eav.error)) {
    throw eav.error
  }
  if (flat.error && !isMissingRelation(flat.error) && !isColumnError(flat.error)) {
    throw flat.error
  }

  return preferences
}

async function savePreferences(service: any, companyId: string, prefs: any, now: string) {
  const eavRows = PREF_KEYS.map((key) => ({
    company_id: companyId,
    employee_id: null,
    category: "preference",
    notification_type: key,
    is_enabled: key === "emailDigest" ? true : !!prefs[key],
    delivery_method:
      key === "smsAlerts" ? ["sms"] : key === "pushNotifications" ? ["push"] : ["email"],
    frequency: key === "emailDigest" ? prefs.emailDigest || "daily" : "immediate",
    updated_at: now,
  }))

  // Clear previous EAV prefs
  await service
    .from("notification_settings")
    .delete()
    .eq("company_id", companyId)
    .eq("category", "preference")
    .is("employee_id", null)

  const eavInsert = await service.from("notification_settings").insert(eavRows)
  if (!eavInsert.error) return { mode: "eav" }

  // Flat-row fallback
  const flatRow = {
    company_id: companyId,
    welcome_notifications: !!prefs.welcomeNotifications,
    payroll_notifications: !!prefs.payrollNotifications,
    leave_notifications: !!prefs.leaveNotifications,
    attendance_alerts: !!prefs.attendanceAlerts,
    promotion_notifications: !!prefs.promotionNotifications,
    system_maintenance_alerts: !!prefs.systemMaintenanceAlerts,
    email_digest: prefs.emailDigest || "daily",
    sms_alerts: !!prefs.smsAlerts,
    push_notifications: !!prefs.pushNotifications,
    updated_at: now,
  }

  const flatUpsert = await service
    .from("notification_settings")
    .upsert(flatRow, { onConflict: "company_id" })
  if (!flatUpsert.error) return { mode: "flat" }

  // Last resort: update any existing company row
  const flatUpdate = await service
    .from("notification_settings")
    .update(flatRow)
    .eq("company_id", companyId)
  if (!flatUpdate.error) return { mode: "flat-update" }

  throw eavInsert.error || flatUpsert.error || flatUpdate.error || new Error("Failed to save preferences")
}

async function persistTemplate(service: any, companyId: string, t: any, userId: string | null, now: string) {
  const name = String(t.name || "").trim()
  const type = t.type || "Email"
  const body = t.body || ""
  const attempts = [
    {
      company_id: companyId,
      name,
      template_name: name,
      category: t.category || "HR",
      type,
      template_type: String(type).toLowerCase(),
      status: t.status || "Active",
      description: t.description || t.subject || "",
      subject: t.subject || "",
      body,
      body_template: body,
      variables: Array.isArray(t.variables) ? t.variables : [],
      is_active: (t.status || "Active") !== "Draft",
      last_modified: now.slice(0, 10),
      updated_at: now,
      created_by: userId,
    },
    {
      company_id: companyId,
      template_name: name,
      template_type: String(type).toLowerCase(),
      category: String(t.category || "hr").toLowerCase(),
      subject: t.subject || "",
      body_template: body || " ",
      variables: Array.isArray(t.variables) ? t.variables : [],
      is_active: (t.status || "Active") !== "Draft",
      updated_at: now,
    },
    {
      company_id: companyId,
      name,
      category: t.category || "HR",
      type,
      status: t.status || "Active",
      description: t.description || t.subject || "",
      subject: t.subject || "",
      body,
      variables: Array.isArray(t.variables) ? t.variables : [],
      last_modified: now,
    },
  ]

  let lastError: any = null
  for (const attempt of attempts) {
    const query = isUuid(t.id)
      ? service.from("notification_templates").update(attempt).eq("id", t.id).eq("company_id", companyId)
      : service.from("notification_templates").insert({ ...attempt, created_at: now })
    const { data, error } = await query.select().single()
    if (!error) return data
    lastError = error
    if (isColumnError(error)) continue
    throw error
  }
  throw lastError || new Error("Failed to save template")
}

export async function GET(req: NextRequest) {
  try {
    const ctx = await resolveTenantContext(req)
    if (ctx instanceof NextResponse) return ctx
    const { companyId, service } = ctx

    const [templatesRes, emailRes, preferences] = await Promise.all([
      service.from("notification_templates").select("*").eq("company_id", companyId).order("updated_at", {
        ascending: false,
      }),
      service.from("email_configurations").select("*").eq("company_id", companyId).maybeSingle(),
      loadPreferences(service, companyId),
    ])

    let templates = templatesRes.data || []
    if (templatesRes.error) {
      if (isMissingRelation(templatesRes.error)) templates = []
      else if (isColumnError(templatesRes.error)) {
        const retry = await service
          .from("notification_templates")
          .select("id, company_id, template_name, template_type, category, subject, body_template, variables, is_active, updated_at, created_at")
          .eq("company_id", companyId)
        if (retry.error && !isMissingRelation(retry.error)) throw retry.error
        templates = retry.data || []
      } else {
        throw templatesRes.error
      }
    }

    let emailConfig = null
    if (!emailRes.error && emailRes.data) {
      emailConfig = {
        provider: emailRes.data.provider || "smtp",
        smtpHost: emailRes.data.smtp_host || "",
        smtpPort: emailRes.data.smtp_port || 587,
        smtpUsername: emailRes.data.smtp_username || "",
        smtpPassword: emailRes.data.smtp_password || "",
        fromEmail: emailRes.data.from_email || "",
        fromName: emailRes.data.from_name || "",
        replyTo: emailRes.data.reply_to || "",
        enableTLS: emailRes.data.enable_tls !== false,
        enableSSL: !!emailRes.data.enable_ssl,
      }
    } else if (emailRes.error && !isMissingRelation(emailRes.error) && !isColumnError(emailRes.error)) {
      throw emailRes.error
    }

    return NextResponse.json({
      templates: templates.map(mapTemplate),
      emailConfig,
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
      if (!String(t.name || "").trim()) {
        return NextResponse.json({ error: "Template name is required" }, { status: 400 })
      }
      const data = await persistTemplate(service, companyId, t, userId, now)
      return NextResponse.json({ success: true, template: mapTemplate(data) })
    }

    if (action === "delete_template") {
      if (!isUuid(body.id)) {
        return NextResponse.json({ error: "Valid template id required" }, { status: 400 })
      }
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
      const attempts = [
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
        {
          company_id: companyId,
          provider: c.provider || "smtp",
          smtp_host: c.smtpHost,
          smtp_port: Number(c.smtpPort || 587),
          smtp_username: c.smtpUsername,
          smtp_password: c.smtpPassword,
          from_email: c.fromEmail || "noreply@example.com",
          from_name: c.fromName,
          reply_to: c.replyTo,
          is_active: true,
          is_default: true,
          updated_at: now,
        },
      ]

      let lastError: any = null
      for (const attempt of attempts) {
        const { error } = await service
          .from("email_configurations")
          .upsert(attempt, { onConflict: "company_id" })
        if (!error) return NextResponse.json({ success: true })
        lastError = error
        if (isColumnError(error)) continue
        throw error
      }
      throw lastError || new Error("Failed to save email configuration")
    }

    if (action === "save_preferences") {
      const prefs = { ...DEFAULT_PREFERENCES, ...(body.preferences || body) }
      const result = await savePreferences(service, companyId, prefs, now)
      return NextResponse.json({ success: true, mode: result.mode })
    }

    if (action === "test_email") {
      const c = body.config || {}
      if (!c.smtpHost && !c.fromEmail) {
        return NextResponse.json(
          { error: "SMTP host and from email are required for a connection test" },
          { status: 400 },
        )
      }
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
