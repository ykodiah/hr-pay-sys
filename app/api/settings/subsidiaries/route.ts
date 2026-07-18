// @ts-nocheck
import { NextRequest, NextResponse } from "next/server"
import { ensureArray, jsonError, resolveTenantContext } from "@/lib/settings/resolve-tenant"

function normalizeSubsidiary(sub: any, employeeCount = 0) {
  const divisions = ensureArray(sub.divisions)
  const departments = ensureArray(sub.departments)
  const locations = ensureArray(sub.locations)
  return {
    ...sub,
    divisions,
    departments,
    locations,
    divisions_count: divisions.length,
    departments_count: departments.length,
    locations_count: locations.length,
    employee_count: employeeCount || sub.employee_count || 0,
    logo_url: sub.logo_url || null,
  }
}

export async function GET(req: NextRequest) {
  try {
    const ctx = await resolveTenantContext(req)
    if (ctx instanceof NextResponse) return ctx
    const { companyId, service } = ctx
    const { searchParams } = new URL(req.url)
    const action = searchParams.get("action")

    if (action === "sync_preferences") {
      const { data } = await service
        .from("subsidiary_sync_preferences")
        .select("*")
        .eq("company_id", companyId)
        .maybeSingle()
      return NextResponse.json({
        preferences: data || {
          sync_hr_policies: true,
          sync_payroll_config: true,
          sync_leave_types: true,
          sync_roles_permissions: false,
        },
      })
    }

    if (action === "employees") {
      const subsidiaryId = searchParams.get("subsidiary_id")
      if (!subsidiaryId) return NextResponse.json({ error: "subsidiary_id is required" }, { status: 400 })
      const { data, error } = await service
        .from("employees")
        .select("*")
        .eq("company_id", companyId)
        .eq("subsidiary_id", subsidiaryId)
      if (error) throw error
      return NextResponse.json({ employees: data || [] })
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
      const csv = [headers.join(","), ...rows.map((row) => row.map((f) => `"${String(f).replace(/"/g, '""')}"`).join(","))].join("\n")
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
        name: body.name,
        tax_id: body.tax_id,
        ssnit_number: body.ssnit_number,
        address: body.address || "",
        phone_number: body.phone_number || "",
        email_address: body.email_address || "",
        industry: body.industry || "",
        status: body.status || "active",
        divisions: ensureArray(body.divisions),
        departments: ensureArray(body.departments),
        locations: ensureArray(body.locations),
        logo_url: body.logo_url || "",
        created_at: now,
        updated_at: now,
      }
      const { data, error } = await service.from("subsidiaries").insert(payload).select().single()
      if (error) throw error
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
      const subsidiaryIds: string[] = Array.isArray(body.subsidiary_ids)
        ? body.subsidiary_ids
        : body.subsidiary_id
          ? [body.subsidiary_id]
          : []

      let query = service
        .from("subsidiaries")
        .update({ settings_synced_at: now, updated_at: now })
        .eq("company_id", companyId)

      if (subsidiaryIds.length) query = query.in("id", subsidiaryIds)

      const { data, error } = await query.select("id")
      if (error) throw error

      const syncTypes = ensureArray(body.sync_types).length
        ? ensureArray(body.sync_types)
        : ["hr_policies", "payroll_config", "leave_types", "roles"]

      const logs = (data || []).flatMap((row) =>
        syncTypes.map((syncType) => ({
          company_id: companyId,
          subsidiary_id: row.id,
          sync_type: syncType,
          sync_status: "completed",
          sync_data: body.sync_data || {},
          synced_by: userId,
          synced_at: now,
        })),
      )
      if (logs.length) {
        await service.from("subsidiary_sync_log").insert(logs)
      }

      return NextResponse.json({ success: true, synced: (data || []).length })
    }

    if (action === "save_sync_preferences") {
      const { error } = await service.from("subsidiary_sync_preferences").upsert(
        {
          company_id: companyId,
          sync_hr_policies: !!body.sync_hr_policies,
          sync_payroll_config: !!body.sync_payroll_config,
          sync_leave_types: !!body.sync_leave_types,
          sync_roles_permissions: !!body.sync_roles_permissions,
          updated_at: now,
        },
        { onConflict: "company_id" },
      )
      if (error) throw error
      return NextResponse.json({ success: true })
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
