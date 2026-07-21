// @ts-nocheck
import { NextRequest, NextResponse } from "next/server"
import { ensureArray, jsonError, resolveTenantContext } from "@/lib/settings/resolve-tenant"

function normalizeSubsidiary(sub: any, employeeCount = 0) {
  const divisions = ensureArray(sub.divisions)
  const departments = ensureArray(sub.departments)
  const locations = ensureArray(sub.locations)
  return {
    ...sub,
    phone_number: sub.phone_number || sub.phone || "",
    email_address: sub.email_address || sub.email || "",
    logo_url: sub.logo_url || sub.logo || null,
    industry: sub.industry || "",
    divisions,
    departments,
    locations,
    divisions_count: divisions.length,
    departments_count: departments.length,
    locations_count: locations.length,
    employee_count: employeeCount || sub.employee_count || 0,
  }
}

const DEFAULT_PREFS = {
  sync_hr_policies: true,
  sync_payroll_config: true,
  sync_leave_types: true,
  sync_roles_permissions: false,
}

async function loadSyncPreferences(service: any, companyId: string) {
  const { data, error } = await service
    .from("subsidiary_sync_preferences")
    .select("*")
    .eq("company_id", companyId)
    .maybeSingle()

  if (!error && data) {
    return {
      sync_hr_policies: !!data.sync_hr_policies,
      sync_payroll_config: !!data.sync_payroll_config,
      sync_leave_types: !!data.sync_leave_types,
      sync_roles_permissions: !!data.sync_roles_permissions,
    }
  }

  // Fallback: company_settings.settings_data.sync_preferences
  const { data: companySettings } = await service
    .from("company_settings")
    .select("settings_data")
    .eq("company_id", companyId)
    .maybeSingle()

  const nested = companySettings?.settings_data?.sync_preferences
  if (nested && typeof nested === "object") {
    return {
      sync_hr_policies: nested.sync_hr_policies !== false,
      sync_payroll_config: nested.sync_payroll_config !== false,
      sync_leave_types: !!nested.sync_leave_types,
      sync_roles_permissions: !!nested.sync_roles_permissions,
    }
  }

  return { ...DEFAULT_PREFS }
}

async function saveSyncPreferences(service: any, companyId: string, prefs: any, now: string) {
  const payload = {
    company_id: companyId,
    sync_hr_policies: !!prefs.sync_hr_policies,
    sync_payroll_config: !!prefs.sync_payroll_config,
    sync_leave_types: !!prefs.sync_leave_types,
    sync_roles_permissions: !!prefs.sync_roles_permissions,
    updated_at: now,
  }

  const { error } = await service
    .from("subsidiary_sync_preferences")
    .upsert(payload, { onConflict: "company_id" })

  if (error) {
    // Fallback into company_settings JSON blob
    const { data: existing } = await service
      .from("company_settings")
      .select("settings_data")
      .eq("company_id", companyId)
      .maybeSingle()

    const settingsData = {
      ...(existing?.settings_data || {}),
      sync_preferences: {
        sync_hr_policies: payload.sync_hr_policies,
        sync_payroll_config: payload.sync_payroll_config,
        sync_leave_types: payload.sync_leave_types,
        sync_roles_permissions: payload.sync_roles_permissions,
      },
    }

    const { error: upsertError } = await service.from("company_settings").upsert(
      {
        company_id: companyId,
        settings_data: settingsData,
        updated_at: now,
      },
      { onConflict: "company_id" },
    )
    if (upsertError) throw upsertError
  }

  return payload
}

async function buildParentSyncSnapshot(service: any, companyId: string, syncTypes: string[]) {
  const snapshot: Record<string, any> = {}

  if (syncTypes.includes("hr_policies")) {
    const { data } = await service.from("hr_configuration").select("*").eq("company_id", companyId).maybeSingle()
    snapshot.hr_policies = data || {}
  }

  if (syncTypes.includes("payroll_config")) {
    const { data } = await service
      .from("system_settings")
      .select("setting_key, setting_value")
      .eq("company_id", companyId)
      .eq("setting_category", "payroll_config")
    snapshot.payroll_config = Object.fromEntries((data || []).map((r) => [r.setting_key, r.setting_value]))
  }

  if (syncTypes.includes("leave_types")) {
    const { data } = await service
      .from("leave_policies")
      .select("name, days, description, carry_over, usage_rate, trend, is_active")
      .eq("company_id", companyId)
      .eq("is_active", true)
    snapshot.leave_types = data || []
  }

  if (syncTypes.includes("roles")) {
    const { data } = await service
      .from("roles")
      .select("name, description, code, level, permissions, is_active")
      .eq("company_id", companyId)
      .eq("is_active", true)
    snapshot.roles_permissions = data || []
  }

  return snapshot
}

export async function GET(req: NextRequest) {
  try {
    const ctx = await resolveTenantContext(req)
    if (ctx instanceof NextResponse) return ctx
    const { companyId, service } = ctx
    const { searchParams } = new URL(req.url)
    const action = searchParams.get("action")

    if (action === "sync_preferences") {
      const preferences = await loadSyncPreferences(service, companyId)
      return NextResponse.json({ preferences })
    }

    if (action === "employees") {
      const subsidiaryId = searchParams.get("subsidiary_id")
      if (!subsidiaryId) return NextResponse.json({ error: "subsidiary_id is required" }, { status: 400 })
      const { data, error } = await service
        .from("employees")
        .select("id, first_name, last_name, full_name, preferred_name, position, department, corporate_email, personal_email, status, subsidiary_id")
        .eq("company_id", companyId)
        .eq("subsidiary_id", subsidiaryId)
        .order("created_at", { ascending: false })
      if (error) throw error

      const employees = (data || []).map((e) => ({
        ...e,
        name: e.full_name || e.preferred_name || [e.first_name, e.last_name].filter(Boolean).join(" ") || "Employee",
        email: e.corporate_email || e.personal_email || "",
      }))
      return NextResponse.json({ employees })
    }

    if (action === "export") {
      const { data, error } = await service
        .from("subsidiaries")
        .select("*")
        .eq("company_id", companyId)
        .order("name")
      if (error) throw error

      const headers = [
        "Name",
        "Tax ID",
        "SSNIT Number",
        "Address",
        "Phone",
        "Email",
        "Industry",
        "Status",
        "Divisions",
        "Departments",
        "Locations",
      ]
      const rows = (data || []).map((sub) => [
        sub.name || "",
        sub.tax_id || "",
        sub.ssnit_number || "",
        sub.address || "",
        sub.phone_number || "",
        sub.email_address || "",
        sub.industry || "",
        sub.status || "",
        ensureArray(sub.divisions).join("; "),
        ensureArray(sub.departments).join("; "),
        ensureArray(sub.locations).join("; "),
      ])
      const csv = [
        headers.join(","),
        ...rows.map((row) => row.map((f) => `"${String(f).replace(/"/g, '""')}"`).join(",")),
      ].join("\n")
      return new NextResponse(csv, {
        headers: {
          "Content-Type": "text/csv",
          "Content-Disposition": 'attachment; filename="subsidiaries_template.csv"',
        },
      })
    }

    const [{ data: subsidiaries, error }, { data: employees }] = await Promise.all([
      service.from("subsidiaries").select("*").eq("company_id", companyId).order("created_at", { ascending: false }),
      service.from("employees").select("id, subsidiary_id").eq("company_id", companyId),
    ])
    if (error) throw error

    const counts = (employees || []).reduce<Record<string, number>>((acc, emp) => {
      if (emp.subsidiary_id) acc[emp.subsidiary_id] = (acc[emp.subsidiary_id] || 0) + 1
      return acc
    }, {})

    return NextResponse.json({
      subsidiaries: (subsidiaries || []).map((sub) => normalizeSubsidiary(sub, counts[sub.id] || 0)),
    })
  } catch (err) {
    return jsonError(err, "Failed to load subsidiaries")
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const ctx = await resolveTenantContext(req, body.company_id)
    if (ctx instanceof NextResponse) return ctx
    const { companyId, service, userId } = ctx
    const now = new Date().toISOString()
    const action = body.action || "create"

    if (action === "create") {
      const payload = {
        company_id: companyId,
        name: String(body.name || "").trim(),
        tax_id: body.tax_id || "",
        ssnit_number: body.ssnit_number || "",
        address: body.address || "",
        phone_number: body.phone_number || "",
        email_address: body.email_address || "",
        industry: body.industry || "",
        status: body.status || "active",
        divisions: ensureArray(body.divisions),
        departments: ensureArray(body.departments),
        locations: ensureArray(body.locations),
        logo_url: body.logo_url || "",
        employee_count: 0,
        created_at: now,
        updated_at: now,
      }

      if (!payload.name) {
        return NextResponse.json({ error: "Subsidiary name is required" }, { status: 400 })
      }

      // Progressive compatibility with old phone/email/logo schemas.
      const attempts = [
        payload,
        (({ industry, employee_count, settings_synced_at, ...core }) => core)(payload),
        {
          company_id: companyId,
          name: payload.name,
          tax_id: payload.tax_id,
          ssnit_number: payload.ssnit_number,
          address: payload.address,
          phone: payload.phone_number,
          email: payload.email_address,
          logo: payload.logo_url,
          divisions: payload.divisions,
          departments: payload.departments,
          locations: payload.locations,
          status: payload.status,
          created_at: now,
          updated_at: now,
        },
      ]

      let data: any = null
      let lastError: any = null
      for (const attempt of attempts) {
        const result = await service.from("subsidiaries").insert(attempt).select().single()
        if (!result.error) {
          data = result.data
          break
        }
        lastError = result.error
        const message = String(result.error.message || "").toLowerCase()
        const schemaMismatch =
          result.error.code === "PGRST204" ||
          message.includes("column") ||
          message.includes("schema cache") ||
          message.includes("could not find")
        if (!schemaMismatch) break
      }
      if (!data) throw lastError || new Error("Failed to create subsidiary")
      return NextResponse.json({ success: true, subsidiary: normalizeSubsidiary(data) })
    }

    if (action === "update") {
      if (!body.id) return NextResponse.json({ error: "id is required" }, { status: 400 })
      const updates: Record<string, unknown> = { updated_at: now }
      for (const key of [
        "name",
        "tax_id",
        "ssnit_number",
        "address",
        "phone_number",
        "email_address",
        "industry",
        "status",
        "logo_url",
        "employee_count",
        "settings_synced_at",
      ]) {
        if (body[key] !== undefined) updates[key] = body[key]
      }
      if (body.divisions !== undefined) updates.divisions = ensureArray(body.divisions)
      if (body.departments !== undefined) updates.departments = ensureArray(body.departments)
      if (body.locations !== undefined) updates.locations = ensureArray(body.locations)

      const { data, error } = await service
        .from("subsidiaries")
        .update(updates)
        .eq("id", body.id)
        .eq("company_id", companyId)
        .select()
        .single()
      if (error) throw error
      return NextResponse.json({ success: true, subsidiary: normalizeSubsidiary(data) })
    }

    if (action === "delete") {
      if (!body.id) return NextResponse.json({ error: "id is required" }, { status: 400 })
      const { error } = await service.from("subsidiaries").delete().eq("id", body.id).eq("company_id", companyId)
      if (error) throw error
      return NextResponse.json({ success: true })
    }

    if (action === "sync") {
      const prefs = await loadSyncPreferences(service, companyId)
      const requestedTypes = ensureArray(body.sync_types)
      const syncTypes =
        requestedTypes.length > 0
          ? requestedTypes
          : [
              prefs.sync_hr_policies ? "hr_policies" : null,
              prefs.sync_payroll_config ? "payroll_config" : null,
              prefs.sync_leave_types ? "leave_types" : null,
              prefs.sync_roles_permissions ? "roles" : null,
            ].filter(Boolean)

      if (!syncTypes.length) {
        return NextResponse.json({ error: "No sync options selected" }, { status: 400 })
      }

      const subsidiaryIds: string[] = Array.isArray(body.subsidiary_ids)
        ? body.subsidiary_ids
        : body.subsidiary_id
          ? [body.subsidiary_id]
          : []

      let listQuery = service.from("subsidiaries").select("id").eq("company_id", companyId)
      if (subsidiaryIds.length) listQuery = listQuery.in("id", subsidiaryIds)
      const { data: targets, error: listError } = await listQuery
      if (listError) throw listError

      const snapshot = await buildParentSyncSnapshot(service, companyId, syncTypes)
      let synced = 0

      for (const target of targets || []) {
        const settingsRow = {
          company_id: companyId,
          subsidiary_id: target.id,
          hr_policies: snapshot.hr_policies || {},
          payroll_config: snapshot.payroll_config || {},
          leave_types: snapshot.leave_types || [],
          roles_permissions: snapshot.roles_permissions || [],
          synced_types: syncTypes,
          settings_synced_at: now,
          updated_at: now,
        }

        const { error: settingsError } = await service
          .from("subsidiary_settings")
          .upsert(settingsRow, { onConflict: "subsidiary_id" })

        if (settingsError) {
          // Table may not exist yet — continue with timestamp + log
          console.warn("[subsidiaries.sync] subsidiary_settings upsert failed", settingsError.message)
        }

        await service
          .from("subsidiaries")
          .update({ settings_synced_at: now, updated_at: now })
          .eq("id", target.id)
          .eq("company_id", companyId)

        const logs = syncTypes.map((syncType) => ({
          company_id: companyId,
          subsidiary_id: target.id,
          sync_type: syncType,
          sync_status: "completed",
          sync_data: snapshot[syncType === "roles" ? "roles_permissions" : syncType] || snapshot,
          synced_by: userId,
          synced_at: now,
        }))
        const { error: logError } = await service.from("subsidiary_sync_log").insert(logs)
        if (logError) {
          console.warn("[subsidiaries.sync] sync log insert failed", logError.message)
        }
        synced += 1
      }

      return NextResponse.json({ success: true, synced, sync_types: syncTypes })
    }

    if (action === "save_sync_preferences") {
      const saved = await saveSyncPreferences(service, companyId, body, now)
      return NextResponse.json({ success: true, preferences: saved })
    }

    if (action === "import") {
      const rows = Array.isArray(body.rows) ? body.rows : []
      if (!rows.length) return NextResponse.json({ error: "No rows to import" }, { status: 400 })
      const payload = rows.map((row: any) => ({
        company_id: companyId,
        name: row.name,
        tax_id: row.tax_id,
        ssnit_number: row.ssnit_number,
        address: row.address || "",
        phone_number: row.phone_number || "",
        email_address: row.email_address || "",
        industry: row.industry || "",
        status: row.status || "active",
        divisions: ensureArray(row.divisions),
        departments: ensureArray(row.departments),
        locations: ensureArray(row.locations),
        created_at: now,
        updated_at: now,
      }))
      const { data, error } = await service.from("subsidiaries").insert(payload).select()
      if (error) throw error
      return NextResponse.json({ success: true, count: data?.length || 0 })
    }

    return NextResponse.json({ error: `Unknown action: ${action}` }, { status: 400 })
  } catch (err) {
    return jsonError(err, "Failed to update subsidiaries")
  }
}
